import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { authConfigured, createSession, hashPassword, setSessionCookie } from "@/lib/auth";
import { query } from "@/lib/db";
import { contentLength, hashKey, clientIp, jsonError, sameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { track } from "@/lib/events";
import { cleanText, isEmail, normalizeEmail, validPassword } from "@/lib/validate";

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

  const email = normalizeEmail(String(body.email ?? ""));
  const password = String(body.password ?? "");
  const agencyName = cleanText(body.agencyName, 80);

  if (!isEmail(email)) return jsonError("Enter a valid email address.", 400);
  if (!validPassword(password)) return jsonError("Use a password with at least 10 characters.", 400);
  if (!agencyName) return jsonError("Enter your agency or studio name.", 400);
  if (!authConfigured()) {
    return jsonError("Accounts are not configured on this deployment yet.", 503);
  }

  const ip = hashKey(clientIp(request));
  if (!(await rateLimit(`signup:${ip}`, 6, 600))) {
    return jsonError("Too many signup attempts. Try again in a few minutes.", 429);
  }
  if (!(await rateLimit(`signup-email:${hashKey(email)}`, 3, 3600))) {
    return jsonError("Too many signup attempts for this email.", 429);
  }

  const existing = await query<{ id: string }>(
    `select id from handoffkit.accounts where email = $1 limit 1`,
    [email],
  );
  if (existing.length > 0) {
    return jsonError("An account with this email already exists. Sign in instead.", 409);
  }

  const { hash, salt } = await hashPassword(password);
  const accountId = randomUUID();

  try {
    await query(
      `insert into handoffkit.accounts
        (id, email, password_hash, password_salt, agency_name, plan)
       values ($1, $2, $3, $4, $5, 'free')`,
      [accountId, email, hash, salt, agencyName],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/duplicate|unique/i.test(message)) {
      return jsonError("An account with this email already exists. Sign in instead.", 409);
    }
    return jsonError("Could not create the account. Try again.", 500);
  }

  const session = await createSession(accountId);
  await setSessionCookie(session.token, session.expiresAt);
  await track("signup", accountId, { source: "web" });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
