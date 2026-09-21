import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { sql } from "../../../../lib/db";

async function allowed() {
  const { userId } = await auth();
  if (!userId) return false;
  const c = await clerkClient();
  const u = await c.users.getUser(userId);
  return u.publicMetadata?.ehrenmann === true;
}

type State = { q: number; v: number };

export async function GET() {
  if (!(await allowed())) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });

  try {
    const currentYear = new Date().getFullYear();
    const stockRows = await sql`
      SELECT product_id,movement_type,quantity::float8,COALESCE(unit_cost,0)::float8 unit_cost,
             source_location_id,destination_location_id
      FROM warehouse_movements
      ORDER BY movement_date,id
    `;

    const states = new Map<string, State>();
    const get = (p: number, l: number) => {
      const k = `${p}:${l}`;
      if (!states.has(k)) states.set(k, { q: 0, v: 0 });
      return states.get(k)!;
    };

    for (const r of stockRows as any[]) {
      const p = Number(r.product_id), q = Number(r.quantity || 0);
      if (!p || q <= 0) continue;
      if (["IN", "RETURN"].includes(String(r.movement_type))) {
        const l = Number(r.destination_location_id); if (!l) continue;
        const st = get(p, l); st.q += q; st.v += q * Number(r.unit_cost || 0);
      } else if (r.movement_type === "TRANSFER") {
        const a = Number(r.source_location_id), b = Number(r.destination_location_id); if (!a || !b) continue;
        const src = get(p, a), avg = src.q > 0 ? src.v / src.q : 0, moved = Math.min(q, Math.max(src.q, 0)), val = moved * avg;
        src.q -= moved; src.v -= val; const dst = get(p, b); dst.q += moved; dst.v += val;
      } else if (["OUT", "SALE", "LOSS"].includes(String(r.movement_type))) {
        const l = Number(r.source_location_id); if (!l) continue;
        const st = get(p, l), avg = st.q > 0 ? st.v / st.q : 0, moved = Math.min(q, Math.max(st.q, 0));
        st.q -= moved; st.v -= moved * avg;
      }
    }

    const stockUnits = [...states.values()].reduce((a, x) => a + Math.max(0, x.q), 0);
    const stockValue = [...states.values()].reduce((a, x) => a + Math.max(0, x.v), 0);

    const [fin] = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN transaction_type='INCOME' THEN amount ELSE 0 END),0)::float8 income,
        COALESCE(SUM(CASE WHEN transaction_type='EXPENSE' THEN amount ELSE 0 END),0)::float8 expenses,
        COALESCE(SUM(CASE WHEN transaction_type='CAPITAL_IN' THEN amount ELSE 0 END),0)::float8 capital_in,
        COALESCE(SUM(CASE WHEN transaction_type='CAPITAL_OUT' THEN amount ELSE 0 END),0)::float8 capital_out
      FROM financial_transactions
      WHERE EXTRACT(YEAR FROM transaction_date)=${currentYear}
    `;
    const cash = Number(fin?.capital_in || 0) + Number(fin?.income || 0) - Number(fin?.expenses || 0) - Number(fin?.capital_out || 0);

    const wh = await sql`
      SELECT wm.id,wm.movement_date::text,wm.movement_type,p.name product_name,wm.quantity::float8,
             COALESCE(dest.name,dl.name,sl.name,'–') location
      FROM warehouse_movements wm
      JOIN products p ON p.id=wm.product_id
      LEFT JOIN address_book dest ON dest.id=wm.destination_address_id
      LEFT JOIN address_book dl ON dl.id=wm.destination_location_id
      LEFT JOIN address_book sl ON sl.id=wm.source_location_id
      ORDER BY wm.movement_date DESC,wm.id DESC LIMIT 5
    `;

    const ft = await sql`
      SELECT ft.id,ft.transaction_date::text,ft.transaction_type,ft.amount::float8,cc.code cost_center_code,
             COALESCE(ab.name,ft.capital_person_name,'–') contact
      FROM financial_transactions ft
      LEFT JOIN cost_centers cc ON cc.id=ft.cost_center_id
      LEFT JOIN address_book ab ON ab.id=ft.address_book_id
      ORDER BY ft.transaction_date DESC,ft.id DESC LIMIT 5
    `;

    return NextResponse.json({
      kpis: { stockUnits, stockValue, income: Number(fin?.income || 0), expenses: Number(fin?.expenses || 0), cash },
      warehouse: wh,
      finance: ft,
    });
  } catch (e) {
    console.error("DASHBOARD_ERROR", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Dashboard konnte nicht geladen werden." }, { status: 500 });
  }
}
