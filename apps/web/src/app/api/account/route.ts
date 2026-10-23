import { NextResponse } from "next/server";
import { getAccount } from "@/lib/auth";
import { query } from "@/lib/db";
import { track } from "@/lib/events";
import { contentLength, jsonError, sameOrigin } from "@/lib/http";
import { cleanText, isHexColor, isHttpsUrl } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return jsonError("Invalid origin.", 403);
  if (contentLength(request) > 20_000) return jsonError("Request is too large.", 413);

  const account = await getAccount();
  if (!account) return jsonError("Sign in first.", 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const agencyName = cleanText(body.agencyName, 80);
  const accent = cleanText(body.accent, 7).toLowerCase();
  const logoUrl = cleanText(body.logoUrl, 500);

  if (!agencyName) return jsonError("Enter your agency or studio name.", 400);
  if (!isHexColor(accent)) return jsonError("Accent colour must be a hex value like #0b6f68.", 400);
  if (!isHttpsUrl(logoUrl)) return jsonError("Logo URL must start with https://.", 400);

  await query(
    `update handoffkit.accounts
     set agency_name = $1, accent = $2, logo_url = $3
     where id = $4`,
    [agencyName, accent, logoUrl || null, account.id],
  );
  await track("settings_updated", account.id, {});

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
