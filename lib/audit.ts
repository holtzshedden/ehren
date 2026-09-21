import { sql } from "./db";

export async function ensureAuditLog() {
  await sql`CREATE TABLE IF NOT EXISTS backend_audit_log (
    id bigserial PRIMARY KEY,
    entity_type text NOT NULL,
    entity_id bigint NOT NULL,
    action text NOT NULL,
    actor_clerk_user_id text,
    actor_name text NOT NULL,
    details jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS backend_audit_log_entity_idx ON backend_audit_log(entity_type, entity_id, created_at DESC)`;
}

export async function audit(input: {entityType:string; entityId:number; action:string; actorUserId?:string|null; actorName:string; details?:Record<string, unknown>|null}) {
  await ensureAuditLog();
  await sql`INSERT INTO backend_audit_log(entity_type,entity_id,action,actor_clerk_user_id,actor_name,details)
    VALUES(${input.entityType},${input.entityId},${input.action},${input.actorUserId||null},${input.actorName},${input.details?JSON.stringify(input.details):null}::jsonb)`;
}
