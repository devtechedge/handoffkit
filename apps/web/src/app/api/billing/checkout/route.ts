import { NextResponse } from "next/server";
import {
  BillingApiError,
  BillingNotConfiguredError,
  createLemonCheckout,
  lemonConfigFromEnv,
} from "@handoffkit/core";
import { getAccount } from "@/lib/auth";
import { track } from "@/lib/events";
import { contentLength, jsonError, sameOrigin } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Invalid origin.", 403);
  if (contentLength(request) > 5000) return jsonError("Request is too large.", 413);

  const account = await getAccount();
  if (!account) return jsonError("Sign in first.", 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }
  const plan = body.plan === "annual" ? "annual" : "monthly";

  const config = lemonConfigFromEnv();
  if (!config) {
    return jsonError(
      "Billing is not open yet. Join the early-access list on the pricing page and we will invite you.",
      503,
    );
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin).replace(/\/$/, "");

  try {
    const checkout = await createLemonCheckout({
      accountId: account.id,
      email: account.email,
      plan,
      siteUrl,
      config,
    });
    await track("checkout_started", account.id, { plan });
    return NextResponse.json(
      { ok: true, url: checkout.url },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BillingNotConfiguredError) return jsonError(error.message, 503);
    if (error instanceof BillingApiError) return jsonError(error.message, 502);
    return jsonError("Could not start checkout.", 500);
  }
}
