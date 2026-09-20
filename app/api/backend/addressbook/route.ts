import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { sql } from "../../../../lib/db";

async function requireEhrenmann() {
  const { userId } = await auth();
  if (!userId) return null;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return user.publicMetadata?.ehrenmann === true ? userId : null;
}

export async function GET(request: Request) {
  const userId = await requireEhrenmann();
  if (!userId) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });

  const archived = new URL(request.url).searchParams.get("archived") === "1";
  const entries = await sql`
    SELECT id, customer_number, types, name, company,
      billing_street, billing_postal_code, billing_city, billing_country,
      delivery_same_as_billing, delivery_street, delivery_postal_code, delivery_city, delivery_country,
      contact_name, phone, email, notes, active
    FROM address_book
    WHERE active = ${!archived}
    ORDER BY name ASC
  `;
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const userId = await requireEhrenmann();
  if (!userId) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const b = await request.json();
  if (!String(b.name || "").trim()) return NextResponse.json({ error: "Name / Firma fehlt." }, { status: 400 });

  const rows = await sql`
    INSERT INTO address_book (
      types, name, company,
      billing_street, billing_postal_code, billing_city, billing_country,
      delivery_same_as_billing, delivery_street, delivery_postal_code, delivery_city, delivery_country,
      contact_name, phone, email, notes, active, created_by_clerk_user_id, updated_by_clerk_user_id
    ) VALUES (
      ${b.types || ["other"]}, ${String(b.name).trim()}, ${b.company || null},
      ${b.billing_street || null}, ${b.billing_postal_code || null}, ${b.billing_city || null}, ${b.billing_country || "Deutschland"},
      ${b.delivery_same_as_billing !== false}, ${b.delivery_street || null}, ${b.delivery_postal_code || null}, ${b.delivery_city || null}, ${b.delivery_country || "Deutschland"},
      ${b.contact_name || null}, ${b.phone || null}, ${b.email || null}, ${b.notes || null}, TRUE, ${userId}, ${userId}
    )
    RETURNING id, customer_number
  `;
  return NextResponse.json({ entry: rows[0] }, { status: 201 });
}
