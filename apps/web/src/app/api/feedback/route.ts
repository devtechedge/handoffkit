import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAccount } from "@/lib/auth";
import { hasDatabase, query } from "@/lib/db";
import { track } from "@/lib/events";
import { clientIp, contentLength, hashKey, jsonError, sameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { cleanText, isEmail, normalizeEmail } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Invalid origin.", 403);
  if (contentLength(request) > 20_000) return jsonError("Request is too large.", 413);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const message = cleanText(body.message, 2000);
  const emailRaw = cleanText(body.email, 254);
  if (message.length < 3) return jsonError("Tell us what is missing or confusing.", 400);
  if (emailRaw && !isEmail(emailRaw)) return jsonError("Enter a valid email address.", 400);
  if (!hasDatabase()) return jsonError("Feedback is not configured yet.", 503);

  const account = await getAccount();
  const ip = hashKey(clientIp(request));
  if (!(await rateLimit(`feedback:${ip}`, 12, 86_400))) {
    return jsonError("Too many feedback messages. Try again tomorrow.", 429);
  }

  await query(
    `insert into handoffkit.feedback (id, account_id, email, message) values ($1, $2, $3, $4)`,
    [randomUUID(), account?.id ?? null, emailRaw ? normalizeEmail(emailRaw) : null, message],
  );
  await track("feedback_submitted", account?.id ?? null, {});

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
