import { NextResponse } from "next/server";
import { clearSessionCookie, destroySession } from "@/lib/auth";
import { jsonError, sameOrigin } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Invalid origin.", 403);
  await destroySession();
  await clearSessionCookie();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
