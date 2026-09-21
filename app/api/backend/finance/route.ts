import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { sql } from "../../../../lib/db";


async function ensureFinanceConstraints() {
  await sql`ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_transaction_type_check`;
  await sql`ALTER TABLE financial_transactions ADD CONSTRAINT financial_transactions_transaction_type_check CHECK (transaction_type IN ('INCOME','EXPENSE','CAPITAL_IN','CAPITAL_OUT'))`;
}

async function me() {
  const { userId } = await auth();

  if (!userId) return null;

  const c = await clerkClient();
  const u = await c.users.getUser(userId);

  if (u.publicMetadata?.ehrenmann !== true) return null;

  return {
    userId,
    name:
      u.fullName ||
      u.firstName ||
      u.primaryEmailAddress?.emailAddress ||
      "User",
  };
}

export async function GET() {
  if (!(await me())) {
    return NextResponse.json(
      { error: "Nicht autorisiert" },
      { status: 403 }
    );
  }

  await sql`ALTER TABLE commercial_documents ADD COLUMN IF NOT EXISTS credit_note_for_id bigint`;
  await sql`ALTER TABLE commercial_documents ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT NOW()`;

  const transactions = await sql`
    SELECT
      ft.id,
      ft.transaction_date::text,
      ft.transaction_type,
      ft.description,
      ft.amount::text,
      ft.source,
      ft.payment_method,
      ft.capital_person_name,
      ft.note,
      cc.code cost_center_code,
      ab.name contact_name,
      fr.name reserve_name,
      ft.created_by_name user_name
    FROM financial_transactions ft
    LEFT JOIN cost_centers cc ON cc.id = ft.cost_center_id
    LEFT JOIN address_book ab ON ab.id = ft.address_book_id
    LEFT JOIN financial_reserves fr ON fr.id = ft.reserve_id
    ORDER BY ft.transaction_date DESC, ft.id DESC
    LIMIT 200
  `;

  const reserves = await sql`
    SELECT
      r.id,
      r.name,
      r.planned_amount::text,
      r.due_date::text,
      r.note,
      r.active,
      cc.code cost_center_code,
      COALESCE(
        SUM(
          CASE
            WHEN ft.transaction_type = 'EXPENSE'
            THEN ft.amount
            ELSE 0
          END
        ),
        0
      )::text used_amount
    FROM financial_reserves r
    LEFT JOIN cost_centers cc ON cc.id = r.cost_center_id
    LEFT JOIN financial_transactions ft ON ft.reserve_id = r.id
    GROUP BY r.id, cc.code
    ORDER BY r.active DESC, r.id DESC
  `;

  const documents = await sql`
    SELECT
      d.id,
      d.document_number,
      d.external_document_number,
      d.document_type,
      d.direction,
      d.status,
      d.document_date::text,
      d.net_amount::text,
      d.tax_amount::text,
      d.gross_amount::text,
      d.note,
      d.attachment_name,
      d.credit_note_for_id,
      d.created_by_name,
      d.created_at::text,
      COALESCE(d.recipient_name, ab.name) contact_name,
      cc.code cost_center_code
    FROM commercial_documents d
    LEFT JOIN address_book ab ON ab.id = d.address_book_id
    LEFT JOIN cost_centers cc ON cc.id = d.cost_center_id
    ORDER BY d.document_date DESC, d.id DESC
    LIMIT 200
  `;

  const contacts = await sql`
    SELECT id, name, types
    FROM address_book
    WHERE active = true
    ORDER BY name
  `;

  const costCenters = await sql`
    SELECT id, code, name
    FROM cost_centers
    WHERE active = true
    ORDER BY code
  `;

  const [t] = await sql`
    SELECT
      COALESCE(
        SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END),
        0
      )::float8 income,
      COALESCE(
        SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END),
        0
      )::float8 expenses,
      COALESCE(
        SUM(CASE WHEN transaction_type = 'CAPITAL_IN' THEN amount ELSE 0 END),
        0
      )::float8 capital_in,
      COALESCE(
        SUM(CASE WHEN transaction_type = 'CAPITAL_OUT' THEN amount ELSE 0 END),
        0
      )::float8 capital_out
    FROM financial_transactions
  `;

  const [rr] = await sql`
    SELECT
      COALESCE(
        SUM(
          GREATEST(
            r.planned_amount - COALESCE(x.used, 0),
            0
          )
        ),
        0
      )::float8 reserved
    FROM financial_reserves r
    LEFT JOIN (
      SELECT
        reserve_id,
        SUM(amount) used
      FROM financial_transactions
      WHERE transaction_type = 'EXPENSE'
        AND reserve_id IS NOT NULL
      GROUP BY reserve_id
    ) x ON x.reserve_id = r.id
    WHERE r.active = true
  `;

  const [cash] = await sql`
    SELECT
      amount::float8,
      account_name,
      snapshot_date::text
    FROM finance_cash_snapshots
    ORDER BY snapshot_date DESC, id DESC
    LIMIT 1
  `;

  return NextResponse.json({
    transactions,
    reserves,
    documents,
    contacts,
    costCenters,
    totals: {
      ...t,
      reserved: rr.reserved,
      cash: cash?.amount ?? null,
      cash_account: cash?.account_name ?? null,
      cash_date: cash?.snapshot_date ?? null,
    },
  });
}

export async function POST(r: Request) {
  try {
    const u = await me();

    if (!u) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    await ensureFinanceConstraints();

    const b = await r.json();

    const type = String(b.transaction_type || "");
    const amount = Number(b.amount);

    if (
      !["INCOME", "EXPENSE", "CAPITAL_IN", "CAPITAL_OUT"].includes(type) ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !b.date
    ) {
      return NextResponse.json(
        { error: "Buchung prüfen." },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO financial_transactions (
        transaction_date,
        transaction_type,
        description,
        amount,
        cost_center_id,
        address_book_id,
        source,
        note,
        created_by_clerk_user_id,
        created_by_name,
        reserve_id,
        payment_method,
        capital_person_name
      )
      VALUES (
        ${b.date},
        ${type},
        ${String(b.description || (type === "CAPITAL_IN" ? "Gründereinlage" : type === "CAPITAL_OUT" ? "Gründerentnahme" : type === "INCOME" ? "Sonstige Einnahme" : "Ausgabe außerhalb Lager"))},
        ${amount},
        ${b.cost_center_id || null},
        ${b.address_book_id || null},
        'FINANCE',
        ${b.note || null},
        ${u.userId},
        ${u.name},
        ${b.reserve_id || null},
        ${null},
        ${b.capital_person_name || null}
      )
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("FINANCE_POST_ERROR", e);

    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Buchung fehlgeschlagen.",
      },
      { status: 500 }
    );
  }
}