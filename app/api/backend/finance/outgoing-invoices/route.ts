import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { sql } from "../../../../../lib/db";
import { audit } from "../../../../../lib/audit";
const r2=(n:number)=>Math.round(n*100)/100;
export async function POST(r:Request){
 try{
  const {userId}=await auth(); if(!userId)return NextResponse.json({error:"Nicht autorisiert"},{status:401});
  const c=await clerkClient(),u=await c.users.getUser(userId); if(u.publicMetadata?.ehrenmann!==true)return NextResponse.json({error:"Nicht autorisiert"},{status:403});
  const b=await r.json(), customerId=Number(b.customer_id), date=String(b.document_date||""), serviceDate=String(b.service_date||date), costCenterId=b.cost_center_id?Number(b.cost_center_id):null;
  const items=Array.isArray(b.items)?b.items:[];
  if(!customerId||!date||!items.length)return NextResponse.json({error:"Kunde, Datum und mindestens eine Position sind Pflicht."},{status:400});
  const clean=items.map((x:any)=>({description:String(x.description||"").trim(),quantity:Number(x.quantity),unit:String(x.unit||"Stk.").trim()||"Stk.",unit_price:Number(x.unit_price),tax_rate:Number(x.tax_rate)}));
  if(clean.some((x:any)=>!x.description||!Number.isFinite(x.quantity)||x.quantity<=0||!Number.isFinite(x.unit_price)||x.unit_price<0||!Number.isFinite(x.tax_rate)||x.tax_rate<0))return NextResponse.json({error:"Rechnungspositionen prüfen."},{status:400});
  const [customer]=await sql`SELECT * FROM address_book WHERE id=${customerId} AND active=true`; if(!customer)return NextResponse.json({error:"Kunde nicht gefunden."},{status:404});
  const [s]=await sql`SELECT * FROM invoice_settings WHERE id=1`;
  let net=0,tax=0; const calc=clean.map((x:any)=>{const n=r2(x.quantity*x.unit_price),t=r2(n*x.tax_rate/100);net=r2(net+n);tax=r2(tax+t);return {...x,net:n,tax:t,gross:r2(n+t)}}); const gross=r2(net+tax);
  const [seq]=await sql`SELECT COALESCE(MAX(id),0)+1 n FROM commercial_documents`; const year=new Date(date+"T00:00:00").getFullYear(); const nr=`RE-${year}-${String(seq.n).padStart(5,"0")}`;
  const name=u.fullName||u.firstName||u.primaryEmailAddress?.emailAddress||"User";
  const [d]=await sql`INSERT INTO commercial_documents(document_number,document_type,direction,status,document_date,service_date,address_book_id,cost_center_id,net_amount,tax_amount,gross_amount,note,recipient_name,recipient_street,recipient_postal_code,recipient_city,recipient_country,issuer_name,issuer_street,issuer_postal_code,issuer_city,issuer_country,issuer_tax_number,issuer_vat_id,issuer_iban,issuer_bic,issuer_bank_name,payment_terms_days,created_by_clerk_user_id,created_by_name)
   VALUES(${nr},'INVOICE','OUTGOING','OPEN',${date},${serviceDate},${customerId},${costCenterId},${net},${tax},${gross},${b.note||null},${customer.name},${customer.billing_street},${customer.billing_postal_code},${customer.billing_city},${customer.billing_country},${s?.issuer_name||null},${s?.issuer_street||null},${s?.issuer_postal_code||null},${s?.issuer_city||null},${s?.issuer_country||'Deutschland'},${s?.tax_number||null},${s?.vat_id||null},${s?.iban||null},${s?.bic||null},${s?.bank_name||null},${s?.payment_terms_days??14},${userId},${name}) RETURNING id`;
  for(const x of calc)await sql`INSERT INTO commercial_document_items(document_id,description,quantity,unit,unit_price,tax_rate,line_total,net_total,tax_total,gross_total) VALUES(${d.id},${x.description},${x.quantity},${x.unit},${x.unit_price},${x.tax_rate},${x.net},${x.net},${x.tax},${x.gross})`;
  await audit({entityType:"document",entityId:Number(d.id),action:"CREATED",actorUserId:userId,actorName:name,details:{document_number:nr,direction:"OUTGOING",gross_amount:gross}});
  return NextResponse.json({ok:true,id:d.id,documentNumber:nr});
 }catch(e){console.error("OUTGOING_INVOICE_ERROR",e);return NextResponse.json({error:e instanceof Error?e.message:"Ausgangsrechnung konnte nicht erstellt werden."},{status:500})}
}
