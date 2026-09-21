import {NextResponse} from "next/server";
import {auth,clerkClient} from "@clerk/nextjs/server";
import {sql} from "../../../../../../lib/db";

async function ok(){const {userId}=await auth();if(!userId)return false;const c=await clerkClient(),u=await c.users.getUser(userId);return u.publicMetadata?.ehrenmann===true}

export async function GET(r:Request,{params}:{params:Promise<{id:string}>}){
  if(!await ok())return NextResponse.json({error:"Nicht autorisiert"},{status:403});
  const{id}=await params;
  await sql`ALTER TABLE commercial_documents ADD COLUMN IF NOT EXISTS credit_note_for_id bigint`;
  const download=new URL(r.url).searchParams.get("download")==="1";

  if(download){
    const[d]=await sql`SELECT attachment_name,attachment_mime_type,attachment_data FROM commercial_documents WHERE id=${+id}`;
    if(!d?.attachment_data)return NextResponse.json({error:"Keine PDF hinterlegt."},{status:404});
    const bytes=d.attachment_data instanceof Uint8Array?d.attachment_data:new Uint8Array(d.attachment_data);
    return new NextResponse(bytes,{headers:{
      "Content-Type":d.attachment_mime_type||"application/pdf",
      "Content-Disposition":`inline; filename="${String(d.attachment_name||"rechnung.pdf").replace(/"/g,"")}"`
    }});
  }

  const[document]=await sql`
    SELECT id,document_number,external_document_number,document_type,direction,status,
      document_date::text,due_date::text,service_date::text,address_book_id,cost_center_id,
      net_amount::text,tax_amount::text,gross_amount::text,note,paid_at::text,
      recipient_name,recipient_street,recipient_postal_code,recipient_city,recipient_country,
      issuer_name,issuer_street,issuer_postal_code,issuer_city,issuer_country,
      issuer_tax_number,issuer_vat_id,issuer_iban,issuer_bic,issuer_bank_name,payment_terms_days,
      attachment_name,credit_note_for_id
    FROM commercial_documents WHERE id=${+id}
  `;
  if(!document)return NextResponse.json({error:"Beleg nicht gefunden."},{status:404});
  const items=await sql`SELECT id,description,quantity::text,unit,unit_price::text,tax_rate::text,line_total::text,net_total::text,tax_total::text,gross_total::text FROM commercial_document_items WHERE document_id=${+id} ORDER BY id`;
  return NextResponse.json({document,items});
}
