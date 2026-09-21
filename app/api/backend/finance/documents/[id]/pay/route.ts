import {NextResponse} from "next/server";
import {auth,clerkClient} from "@clerk/nextjs/server";
import {sql} from "../../../../../../../lib/db";

export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {userId}=await auth();
    if(!userId)return NextResponse.json({error:"Nicht autorisiert"},{status:401});
    const c=await clerkClient(),u=await c.users.getUser(userId);
    if(u.publicMetadata?.ehrenmann!==true)return NextResponse.json({error:"Nicht autorisiert"},{status:403});

    const {id}=await params,b=await r.json();
    const documentId=Number(id),date=String(b.date||"").trim();
    if(!Number.isInteger(documentId)||documentId<=0)return NextResponse.json({error:"Ungültige Beleg-ID."},{status:400});
    if(!date)return NextResponse.json({error:"Zahlungsdatum fehlt."},{status:400});

    const name=u.fullName||u.firstName||u.primaryEmailAddress?.emailAddress||"User";
    await sql`SELECT ehren_pay_document(${documentId},${date}::date,${userId},${name})`;
    return NextResponse.json({ok:true});
  }catch(e){
    console.error("DOCUMENT_PAY_ERROR",e);
    const message=e instanceof Error?e.message:"Zahlung konnte nicht verbucht werden.";
    return NextResponse.json({error:message},{status:500});
  }
}
