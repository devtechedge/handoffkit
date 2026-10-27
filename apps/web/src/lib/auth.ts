import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { effectivePlan, type Plan } from "@handoffkit/core";
import { hasDatabase, query } from "./db";

const COOKIE_NAME = "hk_session";
const SESSION_DAYS = 30;

export interface Account {
  id: string;
  email: string;
  agency_name: string;
  accent: string;
  logo_url: string | null;
  plan: string;
  created_at: string;
  subscription_plan: string | null;
  subscription_status: string | null;
  current_period_end: string | Date | null;
}

export function authConfigured(): boolean {
  if (!hasDatabase()) return false;
  if (process.env.SESSION_PEPPER) return true;
  return process.env.NODE_ENV !== "production";
}

function pepper(): string {
  return process.env.SESSION_PEPPER ?? "handoffkit-local-dev-pepper";
}

export function hashToken(token: string): string {
  return createHash("sha256").update(`${token}:${pepper()}`).digest("hex");
}

function scrypt(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      64,
      { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => {
        if (error) reject(error);
        else resolve(key);
      },
    );
  });
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt);
  return { hash: derived.toString("hex"), salt };
}

export async function verifyPassword(
  password: string,
  salt: string,
  hash: string,
): Promise<boolean> {
  const derived = await scrypt(password, salt);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== derived.length) return false;
  try {
    return timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

export async function createSession(
  accountId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await query(
    `insert into handoffkit.sessions (id, token_hash, account_id, expires_at)
     values ($1, $2, $3, $4)`,
    [randomBytes(16).toString("hex"), hashToken(token), accountId, expiresAt],
  );
  return { token, expiresAt };
}

async function cookieSecure(): Promise<boolean> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)) return false;
  const proto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (proto) return proto === "https";
  return process.env.NODE_ENV === "production";
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await cookieSecure(),
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: await cookieSecure(),
    path: "/",
    maxAge: 0,
  });
}

export async function sessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function destroySession(): Promise<void> {
  const token = await sessionToken();
  if (!token) return;
  try {
    await query(`delete from handoffkit.sessions where token_hash = $1`, [hashToken(token)]);
  } catch {
    // The cookie is cleared even if the database is unavailable.
  }
}

export async function getAccount(): Promise<Account | null> {
  if (!hasDatabase()) return null;
  const token = await sessionToken();
  if (!token) return null;
  try {
    const rows = await query<Account>(
      `select a.id, a.email, a.agency_name, a.accent, a.logo_url, a.plan, a.created_at,
              sub.plan as subscription_plan, sub.status as subscription_status,
              sub.current_period_end
       from handoffkit.sessions sess
       join handoffkit.accounts a on a.id = sess.account_id
       left join handoffkit.subscriptions sub on sub.account_id = a.id
       where sess.token_hash = $1 and sess.expires_at > now()
       limit 1`,
      [hashToken(token)],
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function requireAccount(): Promise<Account> {
  const account = await getAccount();
  if (!account) redirect("/login");
  return account;
}

export function accountPlan(account: Account): Plan {
  if (account.subscription_status) {
    return effectivePlan({
      plan: account.subscription_plan === "pro" ? "pro" : "free",
      status: account.subscription_status,
      currentPeriodEnd: account.current_period_end,
    });
  }
  return account.plan === "pro" ? "pro" : "free";
}
