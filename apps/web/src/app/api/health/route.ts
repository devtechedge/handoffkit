import { NextResponse } from "next/server";
import { lemonConfigFromEnv } from "@handoffkit/core";
import { hasDatabase, query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let db = false;
  if (hasDatabase()) {
    try {
      await query(`select 1 as ok`);
      db = true;
    } catch {
      db = false;
    }
  }
  return NextResponse.json(
    {
      ok: true,
      db,
      billing: Boolean(lemonConfigFromEnv()),
      service: "handoffkit",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
