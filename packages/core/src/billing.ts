import { createHmac, timingSafeEqual } from "node:crypto";

export class BillingNotConfiguredError extends Error {
  constructor(message = "Billing is not configured on this deployment.") {
    super(message);
    this.name = "BillingNotConfiguredError";
  }
}

export class BillingApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BillingApiError";
    this.status = status;
  }
}

export interface LemonConfig {
  apiKey: string;
  storeId: string;
  variantId: string;
  annualVariantId?: string;
  webhookSecret?: string;
}

export type CheckoutPlan = "monthly" | "annual";

export function lemonConfigFromEnv(env: NodeJS.ProcessEnv = process.env): LemonConfig | null {
  const apiKey = env.LEMONSQUEEZY_API_KEY?.trim();
  const storeId = env.LEMONSQUEEZY_STORE_ID?.trim();
  const variantId = env.LEMONSQUEEZY_VARIANT_ID?.trim();
  if (!apiKey || !storeId || !variantId) return null;
  return {
    apiKey,
    storeId,
    variantId,
    annualVariantId: env.LEMONSQUEEZY_VARIANT_ID_ANNUAL?.trim() || undefined,
    webhookSecret: env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim() || undefined,
  };
}

export function verifyLemonSignature(
  secret: string,
  rawBody: string,
  signature: string | null | undefined,
): boolean {
  if (!secret || !signature) return false;
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const expected = Buffer.from(digest, "utf8");
  const received = Buffer.from(signature, "utf8");
  if (expected.length !== received.length) return false;
  try {
    return timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}

export interface LemonCheckoutInput {
  accountId: string;
  email: string;
  plan: CheckoutPlan;
  siteUrl: string;
  config: LemonConfig;
}

export async function createLemonCheckout(input: LemonCheckoutInput): Promise<{ url: string }> {
  const variantId =
    input.plan === "annual" ? input.config.annualVariantId : input.config.variantId;
  if (!variantId) {
    throw new BillingNotConfiguredError("The annual plan is not configured.");
  }

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: input.email,
          custom: {
            account_id: input.accountId,
            plan: input.plan,
          },
        },
        product_options: {
          name: "HandoffKit Pro",
          description: "Unlimited client handover packs, custom branding and PDF export.",
          redirect_url: `${input.siteUrl}/app?checkout=success`,
          receipt_button_text: "Open HandoffKit",
          receipt_link_url: `${input.siteUrl}/app`,
          receipt_thank_you_note: "Thanks. Your Pro plan is active as soon as the payment clears.",
        },
        checkout_options: {
          embed: false,
          media: false,
          logo: true,
          desc: true,
          discount: true,
          button_color: "#0b6f68",
        },
      },
      relationships: {
        store: { data: { type: "stores", id: input.config.storeId } },
        variant: { data: { type: "variants", id: variantId } },
      },
    },
  };

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${input.config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const message =
      isRecord(parsed) && isRecord(parsed.errors) && Array.isArray(parsed.errors)
        ? String((parsed.errors[0] as Record<string, unknown> | undefined)?.detail ?? "Checkout failed")
        : `Checkout failed with status ${response.status}`;
    throw new BillingApiError(message.slice(0, 240), response.status);
  }

  const url =
    isRecord(parsed) &&
    isRecord(parsed.data) &&
    isRecord(parsed.data.attributes) &&
    typeof parsed.data.attributes.url === "string"
      ? parsed.data.attributes.url
      : null;

  if (!url) {
    throw new BillingApiError("Lemon Squeezy did not return a checkout URL.", 502);
  }

  return { url };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export interface LemonEvent {
  eventName: string;
  accountId: string | null;
  subscriptionId: string | null;
  customerId: string | null;
  status: string;
  plan: "free" | "pro";
  currentPeriodEnd: string | null;
  email: string | null;
  variantId: string | null;
}

export function readLemonEvent(event: unknown): LemonEvent {
  const root = isRecord(event) ? event : {};
  const meta = isRecord(root.meta) ? root.meta : {};
  const custom = isRecord(meta.custom_data) ? meta.custom_data : {};
  const data = isRecord(root.data) ? root.data : {};
  const attributes = isRecord(data.attributes) ? data.attributes : {};
  const eventName = typeof meta.event_name === "string" ? meta.event_name : "";
  const accountId =
    typeof custom.account_id === "string"
      ? custom.account_id
      : typeof custom.accountId === "string"
        ? custom.accountId
        : null;
  const subscriptionId = typeof data.id === "string" ? data.id : null;
  const customerId =
    typeof attributes.customer_id === "number"
      ? String(attributes.customer_id)
      : typeof attributes.customer_id === "string"
        ? attributes.customer_id
        : null;
  const status = typeof attributes.status === "string" ? attributes.status : "unknown";
  const currentPeriodEnd =
    typeof attributes.current_period_end === "string" ? attributes.current_period_end : null;
  const email = typeof attributes.user_email === "string" ? attributes.user_email : null;
  const variantId =
    typeof attributes.variant_id === "number"
      ? String(attributes.variant_id)
      : typeof attributes.variant_id === "string"
        ? attributes.variant_id
        : null;

  const paidStatus = ["active", "on_trial", "past_due", "cancelled", "canceled"].includes(
    status.toLowerCase(),
  );
  const plan: "free" | "pro" = eventName.startsWith("subscription_") && paidStatus ? "pro" : "free";

  return {
    eventName,
    accountId,
    subscriptionId,
    customerId,
    status,
    plan,
    currentPeriodEnd,
    email,
    variantId,
  };
}
