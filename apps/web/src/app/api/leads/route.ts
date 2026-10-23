import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { hasDatabase, query } from "@/lib/db";
import { track } from "@/lib/events";
import { clientIp, contentLength, hashKey, jsonError, sameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { cleanText, isEmail, normalizeEmail } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Invalid origin.", 403);
  if (contentLength(request) > 10_000) return jsonError("Request is too large.", 413);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const email = normalizeEmail(String(body.email ?? ""));
  const source = cleanText(body.source, 40) || "pricing";
  const note = cleanText(body.note, 300);

  if (!isEmail(email)) return jsonError("Enter a valid email address.", 400);
  if (!hasDatabase()) return jsonError("The early-access list is not configured yet.", 503);

  const ip = hashKey(clientIp(request));
  if (!(await rateLimit(`lead-ip:${ip}`, 12, 3600))) {
    return jsonError("Too many requests. Try again later.", 429);
  }
  if (!(await rateLimit(`lead-email:${hashKey(email)}`, 3, 86_400))) {
    return jsonError("We already have a recent request for this email.", 429);
  }

  await query(
    `insert into handoffkit.leads (id, email, source, note) values ($1, $2, $3, $4)`,
    [randomUUID(), email, source, note || null],
  );
  await track("lead_captured", null, { source });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
