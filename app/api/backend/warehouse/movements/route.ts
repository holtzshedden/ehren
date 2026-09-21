import {NextResponse} from "next/server";
import {auth} from "@clerk/nextjs/server";
import {sql} from "../../../../../lib/db";

export async function GET(r:Request){
  if(!(await auth()).userId)return NextResponse.json({error:"Nicht autorisiert"},{status:401});
  const q=new URL(r.url).searchParams;
  const year=Number(q.get("year")||new Date().getFullYear());
  const type=q.get("type")||"ALL";
  const limit=Math.min(500,Math.max(5,Number(q.get("limit")||5)));

  const movements=await sql`
    SELECT
      wm.id,wm.movement_date::text,wm.movement_type,p.name product_name,pb.batch_number,
      wm.quantity::text,cc.code cost_center_code,
      CASE WHEN wm.movement_type='RETURN' THEN dest.name ELSE sa.name END source_location,da.name destination_location,dest.name destination_name,
      COALESCE(batch_supplier.name,doc_supplier.name) supplier_name,
      wm.note,wm.created_by_name user_name
    FROM warehouse_movements wm
    JOIN products p ON p.id=wm.product_id
    LEFT JOIN product_batches pb ON pb.id=wm.batch_id
    LEFT JOIN address_book batch_supplier ON batch_supplier.id=pb.supplier_address_id
    LEFT JOIN cost_centers cc ON cc.id=wm.cost_center_id
    LEFT JOIN address_book sa ON sa.id=wm.source_location_id
    LEFT JOIN address_book da ON da.id=wm.destination_location_id
    LEFT JOIN address_book dest ON dest.id=wm.destination_address_id
    LEFT JOIN commercial_documents cd ON cd.warehouse_movement_id=wm.id AND cd.direction='INCOMING'
    LEFT JOIN address_book doc_supplier ON doc_supplier.id=cd.address_book_id
    WHERE EXTRACT(YEAR FROM wm.movement_date)=${year}
      AND (${type}='ALL' OR wm.movement_type=${type})
    ORDER BY wm.movement_date DESC,wm.id DESC
    LIMIT ${limit}
  `;
  return NextResponse.json({movements});
}
