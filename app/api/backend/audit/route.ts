import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { sql } from "../../../../lib/db";
import { ensureAuditLog } from "../../../../lib/audit";

export async function GET(r:Request){
  const {userId}=await auth(); if(!userId)return NextResponse.json({error:"Nicht autorisiert"},{status:401});
  const c=await clerkClient(),u=await c.users.getUser(userId); if(u.publicMetadata?.ehrenmann!==true)return NextResponse.json({error:"Nicht autorisiert"},{status:403});
  await ensureAuditLog();
  const q=new URL(r.url).searchParams, type=String(q.get("type")||""), id=Number(q.get("id"));
  if(!type||!id)return NextResponse.json({error:"Typ oder ID fehlt."},{status:400});
  const history=await sql`SELECT id,action,actor_name,details,created_at::text FROM backend_audit_log WHERE entity_type=${type} AND entity_id=${id} ORDER BY created_at DESC,id DESC`;
  return NextResponse.json({history});
}
