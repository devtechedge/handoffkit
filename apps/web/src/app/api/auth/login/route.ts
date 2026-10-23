import { NextResponse } from "next/server";
import {
  authConfigured,
  createSession,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { query } from "@/lib/db";
import { clientIp, contentLength, hashKey, jsonError, sameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { track } from "@/lib/events";
import { isEmail, normalizeEmail } from "@/lib/validate";

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
  if (!isEmail(email) || !password) {
    return jsonError("Email or password is incorrect.", 401);
  }
  if (!authConfigured()) {
    return jsonError("Accounts are not configured on this deployment yet.", 503);
  }

  const ip = hashKey(clientIp(request));
  if (!(await rateLimit(`login:${ip}`, 20, 600))) {
    return jsonError("Too many sign-in attempts. Try again in a few minutes.", 429);
  }
  if (!(await rateLimit(`login-email:${hashKey(email)}`, 10, 600))) {
    return jsonError("Too many sign-in attempts for this email.", 429);
  }

  const rows = await query<{
    id: string;
    password_hash: string;
    password_salt: string;
  }>(
    `select id, password_hash, password_salt
     from handoffkit.accounts where email = $1 limit 1`,
    [email],
  );

  const account = rows[0];
  if (!account) {
    await verifyPassword(password, "0000000000000000", "0".repeat(128));
    return jsonError("Email or password is incorrect.", 401);
  }

  const valid = await verifyPassword(password, account.password_salt, account.password_hash);
  if (!valid) return jsonError("Email or password is incorrect.", 401);

  const session = await createSession(account.id);
  await setSessionCookie(session.token, session.expiresAt);
  await track("login", account.id, { source: "web" });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
