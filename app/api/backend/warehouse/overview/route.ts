import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { sql } from "../../../../../lib/db";

async function allowed() {
  const { userId } = await auth();
  if (!userId) return false;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return user.publicMetadata?.ehrenmann === true;
}

type State = {
  quantity: number;
  value: number;
};

export async function GET() {
  if (!(await allowed())) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  try {
    /*
      Moving weighted average:
      - IN adds quantity at the actual purchase/unit cost.
      - OUT / SALE / LOSS removes quantity at the CURRENT moving-average cost.
      - TRANSFER removes value from source and adds exactly that same value to destination.
      This means old purchase prices disappear from the valuation as their stock leaves.
    */
    const movements = await sql`
      SELECT
        wm.id,
        wm.movement_date::text,
        wm.movement_type,
        wm.product_id,
        wm.quantity::float8 AS quantity,
        wm.unit_cost::float8 AS unit_cost,
        wm.source_location_id,
        wm.destination_location_id
      FROM warehouse_movements wm
      ORDER BY wm.movement_date ASC, wm.id ASC
    `;

    const states = new Map<string, State>();

    const key = (productId: number, locationId: number) =>
      `${productId}:${locationId}`;

    const get = (productId: number, locationId: number) => {
      const k = key(productId, locationId);
      if (!states.has(k)) states.set(k, { quantity: 0, value: 0 });
      return states.get(k)!;
    };

    for (const row of movements as any[]) {
      const productId = Number(row.product_id);
      const qty = Number(row.quantity || 0);
      if (!qty || qty <= 0) continue;

      if (row.movement_type === "IN") {
        const destination = Number(row.destination_location_id);
        if (!destination) continue;

        const state = get(productId, destination);
        const unitCost = Number(row.unit_cost || 0);

        state.quantity += qty;
        state.value += qty * unitCost;
        continue;
      }

      if (row.movement_type === "TRANSFER") {
        const source = Number(row.source_location_id);
        const destination = Number(row.destination_location_id);
        if (!source || !destination) continue;

        const sourceState = get(productId, source);
        const avg =
          sourceState.quantity > 0
            ? sourceState.value / sourceState.quantity
            : 0;

        const removable = Math.min(qty, Math.max(sourceState.quantity, 0));
        const movedValue = removable * avg;

        sourceState.quantity -= removable;
        sourceState.value -= movedValue;

        if (Math.abs(sourceState.quantity) < 0.0000001) {
          sourceState.quantity = 0;
          sourceState.value = 0;
        }

        const destinationState = get(productId, destination);
        destinationState.quantity += removable;
        destinationState.value += movedValue;
        continue;
      }

      if (["OUT", "SALE", "LOSS"].includes(String(row.movement_type))) {
        const source = Number(row.source_location_id);
        if (!source) continue;

        const state = get(productId, source);
        const avg = state.quantity > 0 ? state.value / state.quantity : 0;
        const removable = Math.min(qty, Math.max(state.quantity, 0));

        state.quantity -= removable;
        state.value -= removable * avg;

        if (Math.abs(state.quantity) < 0.0000001) {
          state.quantity = 0;
          state.value = 0;
        }
      }
    }

    const products = await sql`
      SELECT
        p.id,
        p.name,
        p.category,
        p.unit,
        p.active,
        COALESCE(p.selling_price, 0)::float8 AS selling_price
      FROM products p
      ORDER BY p.name
    `;

    const locations = await sql`
      SELECT id, name
      FROM address_book
      WHERE 'warehouse' = ANY(types)
      ORDER BY name
    `;

    const productMap = new Map(
      (products as any[]).map((p) => [Number(p.id), p])
    );
    const locationMap = new Map(
      (locations as any[]).map((l) => [Number(l.id), l])
    );

    const stock: any[] = [];

    for (const [compoundKey, state] of states.entries()) {
      if (state.quantity <= 0.0000001) continue;

      const [productIdRaw, locationIdRaw] = compoundKey.split(":");
      const productId = Number(productIdRaw);
      const locationId = Number(locationIdRaw);

      const product = productMap.get(productId);
      const location = locationMap.get(locationId);
      if (!product || !location) continue;

      const avgUnitCost =
        state.quantity > 0 ? state.value / state.quantity : 0;
      const sellingPrice = Number(product.selling_price || 0);
      const grossProfitUnit = sellingPrice - avgUnitCost;
      const marginPercent =
        sellingPrice > 0
          ? (grossProfitUnit / sellingPrice) * 100
          : null;

      stock.push({
        product_id: productId,
        product_name: product.name,
        category: product.category,
        unit: product.unit,
        active: product.active,
        location_id: locationId,
        location_name: location.name,
        quantity: state.quantity.toString(),
        avg_unit_cost: avgUnitCost.toString(),
        selling_price: sellingPrice.toString(),
        gross_profit_unit: grossProfitUnit.toString(),
        margin_percent:
          marginPercent === null ? null : marginPercent.toString(),
        stock_value: state.value.toString(),
      });
    }

    stock.sort((a, b) =>
      `${a.product_name} ${a.location_name}`.localeCompare(
        `${b.product_name} ${b.location_name}`,
        "de"
      )
    );

    const years = await sql`
      SELECT DISTINCT EXTRACT(YEAR FROM movement_date)::int AS year
      FROM warehouse_movements
      ORDER BY year DESC
    `;

    const currentYear = new Date().getFullYear();

    const incoming = await sql`
      SELECT COALESCE(SUM(quantity),0)::float8 AS quantity
      FROM warehouse_movements
      WHERE movement_type='IN'
        AND EXTRACT(YEAR FROM movement_date)=${currentYear}
    `;

    const outgoing = await sql`
      SELECT COALESCE(SUM(quantity),0)::float8 AS quantity
      FROM warehouse_movements
      WHERE movement_type IN ('OUT','SALE','LOSS')
        AND EXTRACT(YEAR FROM movement_date)=${currentYear}
    `;

    const stockUnits = stock.reduce(
      (sum, row) => sum + Number(row.quantity || 0),
      0
    );
    const stockValue = stock.reduce(
      (sum, row) => sum + Number(row.stock_value || 0),
      0
    );

    return NextResponse.json({
      stock,
      years: years.map((x: any) => Number(x.year)),
      stats: {
        stockUnits,
        stockValue,
        incoming: Number(incoming[0]?.quantity || 0),
        outgoing: Number(outgoing[0]?.quantity || 0),
      },
      valuationMethod: "MOVING_WEIGHTED_AVERAGE",
    });
  } catch (error) {
    console.error("WAREHOUSE_OVERVIEW_ERROR", error);
    return NextResponse.json(
      { error: "Lagerbestand konnte nicht geladen werden." },
      { status: 500 }
    );
  }
}
