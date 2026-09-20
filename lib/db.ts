import { neon } from "@neondatabase/serverless";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type SqlRow = Record<string, any>;

function getDatabaseUrl(): string {
  // Lokal / klassisches Node.js
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Cloudflare Worker Runtime
  try {
    const { env } = getCloudflareContext();

    const databaseUrl = (
      env as unknown as {
        DATABASE_URL?: string;
      }
    ).DATABASE_URL;

    if (databaseUrl) {
      return databaseUrl;
    }
  } catch {
    // Kein Cloudflare-Kontext vorhanden.
  }

  throw new Error("DATABASE_URL fehlt.");
}

export async function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<SqlRow[]> {
  const query = neon(getDatabaseUrl());

  const result = await query(strings, ...values);

  return result as SqlRow[];
}