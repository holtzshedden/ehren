import {NextResponse} from "next/server";
import {auth,clerkClient} from "@clerk/nextjs/server";
import {sql} from "../../../../../lib/db";

const r2=(n:number)=>Math.round(n*100)/100;

export async function POST(r:Request){
  try{
    const {userId}=await auth();
    if(!userId)return NextResponse.json({error:"Nicht autorisiert"},{status:401});
    const c=await clerkClient(),u=await c.users.getUser(userId);
    if(u.publicMetadata?.ehrenmann!==true)return NextResponse.json({error:"Nicht autorisiert"},{status:403});

    const form=await r.formData();
    const supplierId=Number(form.get("supplier_id"));
    const externalNumber=String(form.get("external_document_number")||"").trim();
    const date=String(form.get("document_date")||"").trim();
    const serviceDate=String(form.get("service_date")||date).trim();
    const costCenterId=form.get("cost_center_id")?Number(form.get("cost_center_id")):null;
    const linkedMovementId=form.get("linked_warehouse_movement_id")?Number(form.get("linked_warehouse_movement_id")):null;
    const net=Number(form.get("net_amount"));
    const taxRate=Number(form.get("tax_rate")??19);
    const note=String(form.get("note")||"").trim()||null;
    const file=form.get("file");

    if(!supplierId||!externalNumber||!date||!Number.isFinite(net)||net<0||!Number.isFinite(taxRate)||taxRate<0)
      return NextResponse.json({error:"Lieferant, Rechnungsnummer, Datum, Netto und MwSt. sind Pflichtfelder."},{status:400});

    const [supplier]=await sql`
      SELECT id,name,billing_street,billing_postal_code,billing_city,billing_country
      FROM address_book WHERE id=${supplierId} AND active=true
    `;
    if(!supplier)return NextResponse.json({error:"Lieferant nicht gefunden."},{status:404});

    let attachmentName=null,attachmentMime=null,attachmentData:null;
    if(file instanceof File && file.size>0){
      if(file.type!=="application/pdf")return NextResponse.json({error:"Als Anhang ist nur PDF erlaubt."},{status:400});
      if(file.size>10*1024*1024)return NextResponse.json({error:"PDF darf maximal 10 MB groß sein."},{status:400});
      attachmentName=file.name;
      attachmentMime=file.type;
      attachmentData=Buffer.from(await file.arrayBuffer());
    }

    if(linkedMovementId){
      const [movement]=await sql`
        SELECT wm.id,pb.supplier_address_id
        FROM warehouse_movements wm
        LEFT JOIN product_batches pb ON pb.id=wm.batch_id
        WHERE wm.id=${linkedMovementId} AND wm.movement_type='IN'
      `;
      if(!movement)return NextResponse.json({error:"Wareneingang nicht gefunden."},{status:404});
      if(movement.supplier_address_id && Number(movement.supplier_address_id)!==supplierId)
        return NextResponse.json({error:"Wareneingang gehört zu einem anderen Lieferanten."},{status:409});
      const [used]=await sql`
        SELECT id FROM commercial_documents
        WHERE linked_warehouse_movement_id=${linkedMovementId}
          AND direction='INCOMING' AND status<>'CANCELLED'
        LIMIT 1
      `;
      if(used)return NextResponse.json({error:"Dieser Wareneingang ist bereits mit einer Eingangsrechnung verknüpft."},{status:409});
    }

    const tax=r2(net*taxRate/100),gross=r2(net+tax);
    const name=u.fullName||u.firstName||"User";
    const seq=await sql`SELECT COALESCE(MAX(id),0)+1 AS n FROM commercial_documents`;
    const internalNumber=`ER-${new Date(date+"T00:00:00").getFullYear()}-${String(seq[0].n).padStart(5,"0")}`;

    const[d]=await sql`
      INSERT INTO commercial_documents(
        document_number,external_document_number,document_type,direction,status,
        document_date,service_date,address_book_id,cost_center_id,
        net_amount,tax_amount,gross_amount,note,
        recipient_name,recipient_street,recipient_postal_code,recipient_city,recipient_country,
        attachment_name,attachment_mime_type,attachment_data,linked_warehouse_movement_id,
        created_by_clerk_user_id,created_by_name
      )
      VALUES(
        ${internalNumber},${externalNumber},'INVOICE','INCOMING','OPEN',
        ${date},${serviceDate||date},${supplierId},${costCenterId},
        ${net},${tax},${gross},${note},
        ${supplier.name},${supplier.billing_street},${supplier.billing_postal_code},${supplier.billing_city},${supplier.billing_country},
        ${attachmentName},${attachmentMime},${attachmentData},${linkedMovementId},
        ${userId},${name}
      )
      RETURNING id,document_number
    `;
    return NextResponse.json({ok:true,id:d.id,documentNumber:d.document_number,net,tax,gross});
  }catch(e){
    console.error("MANUAL_INCOMING_INVOICE_ERROR",e);
    return NextResponse.json({error:"Eingangsrechnung konnte nicht gespeichert werden."},{status:500});
  }
}
