import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { sql } from "../../../../lib/db";

async function allowed(){
  const {userId}=await auth();
  if(!userId)return false;
  const c=await clerkClient();
  const u=await c.users.getUser(userId);
  return u.publicMetadata?.ehrenmann===true;
}

export async function GET(){
  try{
    if(!(await allowed()))return NextResponse.json({error:"Nicht autorisiert"},{status:403});
    const documents=await sql`
      SELECT d.id,d.document_number,d.external_document_number,d.document_type,d.direction,d.status,
             d.document_date::text,d.net_amount::text,d.tax_amount::text,d.gross_amount::text,
             d.attachment_name,d.credit_note_for_id,
             COALESCE(d.recipient_name,ab.name) contact_name,cc.code cost_center_code
      FROM commercial_documents d
      LEFT JOIN address_book ab ON ab.id=d.address_book_id
      LEFT JOIN cost_centers cc ON cc.id=d.cost_center_id
      ORDER BY d.document_date DESC,d.id DESC
    `;
    return NextResponse.json({documents});
  }catch(e){
    console.error("CLOSING_GET_ERROR",e);
    return NextResponse.json({error:e instanceof Error?e.message:"Abschluss konnte nicht geladen werden."},{status:500});
  }
}
