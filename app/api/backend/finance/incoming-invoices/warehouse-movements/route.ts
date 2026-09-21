import {NextResponse} from "next/server";
import {auth,clerkClient} from "@clerk/nextjs/server";
import {sql} from "../../../../../../lib/db";

export async function GET(r:Request){
  await sql`ALTER TABLE warehouse_movements ADD COLUMN IF NOT EXISTS shipping_net numeric(14,2) NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE warehouse_movements ADD COLUMN IF NOT EXISTS shipping_tax_rate numeric(6,2) NOT NULL DEFAULT 19`;
  const {userId}=await auth();
  if(!userId)return NextResponse.json({error:"Nicht autorisiert"},{status:401});
  const c=await clerkClient(),u=await c.users.getUser(userId);
  if(u.publicMetadata?.ehrenmann!==true)return NextResponse.json({error:"Nicht autorisiert"},{status:403});

  const supplierId=Number(new URL(r.url).searchParams.get("supplier_id")||0);

  const movements=await sql`
    SELECT
      wm.id,
      wm.movement_date::text,
      wm.product_id,
      p.name AS product_name,
      p.unit,
      wm.quantity::float8 AS quantity,
      wm.unit_cost::float8 AS unit_cost,
      (wm.quantity * wm.unit_cost + COALESCE(wm.shipping_net,0))::float8 AS net_total,
      COALESCE(wm.shipping_net,0)::float8 AS shipping_net,
      COALESCE(wm.shipping_tax_rate,19)::float8 AS shipping_tax_rate,
      wm.cost_center_id,
      cc.code AS cost_center_code,
      pb.supplier_address_id AS supplier_id,
      supplier.name AS supplier_name,
      destination.name AS warehouse_name,
      EXISTS(
        SELECT 1
        FROM commercial_documents cd
        WHERE cd.linked_warehouse_movement_id=wm.id
          AND cd.direction='INCOMING'
          AND cd.status<>'CANCELLED'
      ) AS already_linked
    FROM warehouse_movements wm
    JOIN products p ON p.id=wm.product_id
    LEFT JOIN product_batches pb ON pb.id=wm.batch_id
    LEFT JOIN address_book supplier ON supplier.id=pb.supplier_address_id
    LEFT JOIN address_book destination ON destination.id=wm.destination_location_id
    LEFT JOIN cost_centers cc ON cc.id=wm.cost_center_id
    WHERE wm.movement_type='IN'
      AND (${supplierId}=0 OR pb.supplier_address_id=${supplierId})
    ORDER BY wm.movement_date DESC,wm.id DESC
    LIMIT 200
  `;

  return NextResponse.json({movements});
}
