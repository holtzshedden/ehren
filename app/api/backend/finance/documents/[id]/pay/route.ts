import {NextResponse} from "next/server";
import {auth,clerkClient} from "@clerk/nextjs/server";
import {sql} from "../../../../../../../lib/db";import {audit} from "../../../../../../../lib/audit";

export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {userId}=await auth();
    if(!userId)return NextResponse.json({error:"Nicht autorisiert"},{status:401});
    const c=await clerkClient(),u=await c.users.getUser(userId);
    if(u.publicMetadata?.ehrenmann!==true)return NextResponse.json({error:"Nicht autorisiert"},{status:403});

    await sql`ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_transaction_type_check`;
    await sql`ALTER TABLE financial_transactions ADD CONSTRAINT financial_transactions_transaction_type_check CHECK (transaction_type IN ('INCOME','EXPENSE','CAPITAL_IN','CAPITAL_OUT'))`;

    const{id}=await params,b=await r.json();
    const date=String(b.date||"").trim();
    if(!date)return NextResponse.json({error:"Zahlungsdatum fehlt."},{status:400});

    const[d]=await sql`SELECT * FROM commercial_documents WHERE id=${+id}`;
    if(!d)return NextResponse.json({error:"Beleg nicht gefunden."},{status:404});
    if(d.status!=="OPEN")return NextResponse.json({error:"Beleg ist nicht mehr offen."},{status:409});

    const name=u.fullName||u.firstName||u.primaryEmailAddress?.emailAddress||"User";
    const description=`Zahlung ${d.external_document_number||d.document_number}`;

    await sql`UPDATE commercial_documents SET status='PAID',paid_at=${date} WHERE id=${+id}`;

    await sql`
      INSERT INTO financial_transactions(
        transaction_date,transaction_type,description,amount,cost_center_id,address_book_id,
        source,note,created_by_clerk_user_id,created_by_name,payment_method
      )
      VALUES(
        ${date},${d.direction==="OUTGOING"?"INCOME":"EXPENSE"},${description},${d.gross_amount},
        ${d.cost_center_id},${d.address_book_id},'DOCUMENT',${d.note},
        ${userId},${name},${null}
      )
    `;
    await audit({entityType:"document",entityId:+id,action:"PAID",actorUserId:userId,actorName:name,details:{payment_date:date,amount:Number(d.gross_amount)}});
    return NextResponse.json({ok:true});
  }catch(e){
    console.error("DOCUMENT_PAY_ERROR",e);
    return NextResponse.json({error:"Zahlung konnte nicht verbucht werden."},{status:500});
  }
}
