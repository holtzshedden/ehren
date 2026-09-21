import {NextResponse} from "next/server";
import {auth,clerkClient} from "@clerk/nextjs/server";
import {sql} from "../../../../../../../lib/db";
export async function POST(_r:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {userId}=await auth(); if(!userId)return NextResponse.json({error:"Nicht autorisiert"},{status:401});
  const c=await clerkClient(),u=await c.users.getUser(userId); if(u.publicMetadata?.ehrenmann!==true)return NextResponse.json({error:"Nicht autorisiert"},{status:403});
  await sql`ALTER TABLE commercial_documents ADD COLUMN IF NOT EXISTS credit_note_for_id bigint`;
  await sql`ALTER TABLE warehouse_movements DROP CONSTRAINT IF EXISTS warehouse_movements_movement_type_check`;
  await sql`ALTER TABLE warehouse_movements ADD CONSTRAINT warehouse_movements_movement_type_check CHECK (movement_type IN ('IN','OUT','SALE','LOSS','TRANSFER','RETURN'))`;
  const {id}=await params; const[d]=await sql`SELECT * FROM commercial_documents WHERE id=${+id}`;
  if(!d||d.direction!=="OUTGOING")return NextResponse.json({error:"Ausgangsrechnung nicht gefunden."},{status:404});
  if(d.status!=="OPEN")return NextResponse.json({error:"Nur offene Rechnungen können gutgeschrieben werden."},{status:409});
  const[existing]=await sql`SELECT id FROM commercial_documents WHERE credit_note_for_id=${+id} LIMIT 1`; if(existing)return NextResponse.json({error:"Für diese Rechnung existiert bereits eine Gutschrift."},{status:409});
  const items=await sql`SELECT * FROM commercial_document_items WHERE document_id=${+id} ORDER BY id`;
  const name=u.fullName||u.firstName||u.primaryEmailAddress?.emailAddress||"User"; const nr=`${d.document_number}-CN`; const today=new Date().toISOString().slice(0,10);
  let returnMovementId:null|number=null;
  if(d.warehouse_movement_id){
   const[m]=await sql`SELECT * FROM warehouse_movements WHERE id=${d.warehouse_movement_id}`;
   if(m?.product_id&&m?.source_location_id){const[costRow]=await sql`SELECT COALESCE((SELECT unit_cost::float8 FROM product_batches WHERE product_id=${m.product_id} ORDER BY received_date DESC,id DESC LIMIT 1),0)::float8 unit_cost`;const[x]=await sql`INSERT INTO warehouse_movements(movement_date,movement_type,product_id,batch_id,quantity,unit_cost,destination_location_id,destination_address_id,cost_center_id,note,created_by_clerk_user_id,created_by_name) VALUES(${today},'RETURN',${m.product_id},${m.batch_id||null},${m.quantity},${Number(m.unit_cost||costRow?.unit_cost||0)},${m.source_location_id},${d.address_book_id},${m.cost_center_id||null},${`Gutschrift ${d.document_number}`},${userId},${name}) RETURNING id`; returnMovementId=x.id;}
  }
  const[cn]=await sql`INSERT INTO commercial_documents(document_number,document_type,direction,status,document_date,service_date,address_book_id,warehouse_movement_id,cost_center_id,net_amount,tax_amount,gross_amount,note,recipient_name,recipient_street,recipient_postal_code,recipient_city,recipient_country,issuer_name,issuer_street,issuer_postal_code,issuer_city,issuer_country,issuer_tax_number,issuer_vat_id,issuer_iban,issuer_bic,issuer_bank_name,payment_terms_days,created_by_clerk_user_id,created_by_name,credit_note_for_id) VALUES(${nr},'INVOICE','OUTGOING','SETTLED',${today},${today},${d.address_book_id},${returnMovementId},${d.cost_center_id},${-Number(d.net_amount)},${-Number(d.tax_amount)},${-Number(d.gross_amount)},${`Gutschrift zu ${d.document_number}`},${d.recipient_name},${d.recipient_street},${d.recipient_postal_code},${d.recipient_city},${d.recipient_country},${d.issuer_name},${d.issuer_street},${d.issuer_postal_code},${d.issuer_city},${d.issuer_country},${d.issuer_tax_number},${d.issuer_vat_id},${d.issuer_iban},${d.issuer_bic},${d.issuer_bank_name},${d.payment_terms_days},${userId},${name},${+id}) RETURNING id`;
  for(const x of items)await sql`INSERT INTO commercial_document_items(document_id,product_id,description,quantity,unit,unit_price,tax_rate,line_total,net_total,tax_total,gross_total) VALUES(${cn.id},${x.product_id},${x.description},${-Number(x.quantity)},${x.unit},${x.unit_price},${x.tax_rate},${-Number(x.line_total)},${-Number(x.net_total)},${-Number(x.tax_total)},${-Number(x.gross_total)})`;
  await sql`UPDATE commercial_documents SET status='CANCELLED' WHERE id=${+id}`;
  return NextResponse.json({ok:true,id:cn.id,documentNumber:nr});
 }catch(e){console.error("CREDIT_NOTE_ERROR",e);return NextResponse.json({error:e instanceof Error?e.message:"Gutschrift konnte nicht erstellt werden."},{status:500})}
}
