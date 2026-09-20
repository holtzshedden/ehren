import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { sql } from "../../../../../lib/db";

async function requireEhrenmann() {
  const { userId } = await auth();
  if (!userId) return null;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return user.publicMetadata?.ehrenmann === true ? userId : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await requireEhrenmann();
  if (!userId) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const { id } = await context.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  const b = await request.json();

  if (typeof b.active === "boolean" && Object.keys(b).length === 1) {
    await sql`UPDATE address_book SET active=${b.active}, updated_by_clerk_user_id=${userId}, updated_at=NOW() WHERE id=${numericId}`;
    return NextResponse.json({ success: true });
  }

  if (!String(b.name || "").trim()) return NextResponse.json({ error: "Name / Firma fehlt." }, { status: 400 });
  await sql`
    UPDATE address_book SET
      types=${b.types || ["other"]}, name=${String(b.name).trim()}, company=${b.company || null},
      billing_street=${b.billing_street || null}, billing_postal_code=${b.billing_postal_code || null}, billing_city=${b.billing_city || null}, billing_country=${b.billing_country || "Deutschland"},
      delivery_same_as_billing=${b.delivery_same_as_billing !== false}, delivery_street=${b.delivery_street || null}, delivery_postal_code=${b.delivery_postal_code || null}, delivery_city=${b.delivery_city || null}, delivery_country=${b.delivery_country || "Deutschland"},
      contact_name=${b.contact_name || null}, phone=${b.phone || null}, email=${b.email || null}, notes=${b.notes || null},
      updated_by_clerk_user_id=${userId}, updated_at=NOW()
    WHERE id=${numericId}
  `;
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await requireEhrenmann();
  if (!userId) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const { id } = await context.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });

  try {
    const result = await sql`DELETE FROM address_book WHERE id=${numericId} RETURNING id`;
    if (!result.length) return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Dieser Eintrag wird bereits verwendet und kann nicht gelöscht werden. Bitte stattdessen archivieren." }, { status: 409 });
  }
}
