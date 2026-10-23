import { NextResponse } from "next/server";
import { readLemonEvent, verifyLemonSignature } from "@handoffkit/core";
import { query } from "@/lib/db";
import { track } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 100_000) {
    return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
  }

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Webhook secret is not configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("x-signature");
  if (!verifyLemonSignature(secret, raw, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
  }

  let event: unknown;
  try {
    event = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = readLemonEvent(event);
  if (!parsed.accountId) {
    return NextResponse.json({ ok: true, stored: false, reason: "no account reference" });
  }
  if (!parsed.eventName.startsWith("subscription_")) {
    return NextResponse.json({ ok: true, stored: false, reason: "ignored event" });
  }

  try {
    await query(
      `insert into handoffkit.subscriptions
        (account_id, provider, customer_id, subscription_id, plan, status, current_period_end, updated_at)
       values ($1, 'lemonsqueezy', $2, $3, $4, $5, $6, now())
       on conflict (account_id) do update set
         provider = excluded.provider,
         customer_id = excluded.customer_id,
         subscription_id = excluded.subscription_id,
         plan = excluded.plan,
         status = excluded.status,
         current_period_end = excluded.current_period_end,
         updated_at = now()`,
      [
        parsed.accountId,
        parsed.customerId,
        parsed.subscriptionId,
        parsed.plan,
        parsed.status,
        parsed.currentPeriodEnd,
      ],
    );
    await query(
      `update handoffkit.accounts set plan = $1 where id = $2`,
      [parsed.plan, parsed.accountId],
    );
    await track("subscription_updated", parsed.accountId, {
      event: parsed.eventName,
      status: parsed.status,
      plan: parsed.plan,
    });
    return NextResponse.json(
      { ok: true, stored: true, plan: parsed.plan, status: parsed.status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Could not store event" }, { status: 500 });
  }
}
