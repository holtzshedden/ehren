import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { sql } from "../../../../lib/db";

async function ok() {
  const { userId } = await auth();
  if (!userId) return false;
  const c = await clerkClient();
  const u = await c.users.getUser(userId);
  return u.publicMetadata?.ehrenmann === true;
}

async function ensure() {
  await sql`ALTER TABLE cost_centers ADD COLUMN IF NOT EXISTS description text`;
}

export async function GET(r: Request) {
  if (!(await ok())) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  await ensure();
  const archived = new URL(r.url).searchParams.get("archived") === "1";

  // Controlling is accrual-based: invoices count when issued/received, not only when paid.
  // Manual finance entries count too, but DOCUMENT payment rows are excluded to avoid double counting invoices.
  const rows = await sql`
    SELECT
      cc.id, cc.code, cc.name, cc.description, cc.active,
      (
        COALESCE((SELECT SUM(CASE WHEN ft.transaction_type IN ('INCOME','CAPITAL_IN') THEN ft.amount ELSE 0 END)
                  FROM financial_transactions ft
                  WHERE ft.cost_center_id=cc.id AND COALESCE(ft.source,'') <> 'DOCUMENT'),0)
        +
        COALESCE((SELECT SUM(CASE WHEN cd.direction='OUTGOING' THEN cd.gross_amount ELSE 0 END)
                  FROM commercial_documents cd
                  WHERE cd.cost_center_id=cc.id),0)
      )::float8 AS income,
      (
        COALESCE((SELECT SUM(CASE WHEN ft.transaction_type IN ('EXPENSE','CAPITAL_OUT') THEN ft.amount ELSE 0 END)
                  FROM financial_transactions ft
                  WHERE ft.cost_center_id=cc.id AND COALESCE(ft.source,'') <> 'DOCUMENT'),0)
        +
        COALESCE((SELECT SUM(CASE WHEN cd.direction='INCOMING' THEN cd.gross_amount ELSE 0 END)
                  FROM commercial_documents cd
                  WHERE cd.cost_center_id=cc.id AND cd.status <> 'CANCELLED'),0)
      )::float8 AS expenses
    FROM cost_centers cc
    WHERE cc.active=${!archived}
    ORDER BY cc.code
  `;
  return NextResponse.json({ costCenters: rows });
}

export async function POST(r: Request) {
  if (!(await ok())) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  await ensure();
  const b = await r.json(), code = String(b.code || "").trim().toUpperCase(), name = String(b.name || "").trim();
  if (!code || !name) return NextResponse.json({ error: "Code und Name sind Pflichtfelder." }, { status: 400 });
  try {
    await sql`INSERT INTO cost_centers(code,name,description,active) VALUES(${code},${name},${b.description || null},true)`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Kostenstelle konnte nicht angelegt werden. Code eventuell bereits vorhanden." }, { status: 409 });
  }
}

export async function PATCH(r: Request) {
  if (!(await ok())) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  await ensure();
  const b = await r.json(), id = Number(b.id);
  if (!id) return NextResponse.json({ error: "ID fehlt." }, { status: 400 });
  if (typeof b.active === "boolean") {
    await sql`UPDATE cost_centers SET active=${b.active} WHERE id=${id}`;
  } else {
    const code = String(b.code || "").trim().toUpperCase(), name = String(b.name || "").trim();
    if (!code || !name) return NextResponse.json({ error: "Code und Name sind Pflichtfelder." }, { status: 400 });
    await sql`UPDATE cost_centers SET code=${code},name=${name},description=${b.description || null} WHERE id=${id}`;
  }
  return NextResponse.json({ ok: true });
}
