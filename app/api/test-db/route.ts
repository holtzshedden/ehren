import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });

    const databaseUrl = (
      env as unknown as {
        DATABASE_URL?: string;
      }
    ).DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL im Cloudflare env fehlt.");
    }

    const sql = neon(databaseUrl);
    const result = await sql`SELECT 1 AS test`;

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error("DIRECT NEON TEST ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}