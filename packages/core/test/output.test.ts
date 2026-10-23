import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import {
  analyzeWorkflow,
  effectivePlan,
  canCreatePack,
  canUseBranding,
  renderPackMarkdown,
  renderPackPdf,
  RISKY_WORKFLOW,
  SAMPLE_WORKFLOW,
  readLemonEvent,
  verifyLemonSignature,
} from "../dist/index.js";

test("renders Markdown with the main sections", () => {
  const pack = analyzeWorkflow(SAMPLE_WORKFLOW, {
    clientName: "Northstar Studio",
    agencyName: "Handoff Studio",
    generatedAt: "2026-10-23T00:00:00.000Z",
  });
  const markdown = renderPackMarkdown(pack);
  assert.equal(markdown.includes("# Inbound lead qualifier"), true);
  assert.equal(markdown.includes("## AI register"), true);
  assert.equal(markdown.includes("## Credentials"), true);
  assert.equal(markdown.includes("## Acceptance checklist"), true);
  assert.equal(markdown.includes("Northstar Studio"), true);
  assert.equal(markdown.includes("Handoff Studio"), true);
  assert.equal(markdown.includes("sk-proj-REPLACE_WITH_REAL_KEY"), false);
});

test("Markdown never contains a secret from a risky workflow", () => {
  const pack = analyzeWorkflow(RISKY_WORKFLOW);
  const markdown = renderPackMarkdown(pack);
  assert.equal(markdown.includes("sk-proj-REPLACE_WITH_REAL_KEY"), false);
  assert.equal(markdown.includes("Hardcoded"), true);
});

test("renders a real multi-page PDF", async () => {
  const pack = analyzeWorkflow(SAMPLE_WORKFLOW, {
    clientName: "Northstar Studio",
    agencyName: "Handoff Studio",
  });
  const bytes = await renderPackPdf(pack);
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), "%PDF-");
  assert.equal(bytes.length > 4000, true);
  const doc = await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount() >= 3, true);
  assert.equal(doc.getTitle(), "Inbound lead qualifier - handover pack");
});

test("free plan is limited to one pack", () => {
  assert.equal(canCreatePack("free", 0), true);
  assert.equal(canCreatePack("free", 1), false);
  assert.equal(canCreatePack("pro", 1000), true);
  assert.equal(canUseBranding("free"), false);
  assert.equal(canUseBranding("pro"), true);
});

test("paid access survives cancellation until the period ends", () => {
  const now = new Date("2026-10-23T00:00:00.000Z");
  assert.equal(
    effectivePlan(
      { plan: "pro", status: "cancelled", currentPeriodEnd: "2026-11-23T00:00:00.000Z" },
      now,
    ),
    "pro",
  );
  assert.equal(
    effectivePlan(
      { plan: "pro", status: "cancelled", currentPeriodEnd: "2026-10-01T00:00:00.000Z" },
      now,
    ),
    "free",
  );
  assert.equal(effectivePlan({ plan: "pro", status: "expired" }, now), "free");
});

test("verifies a Lemon Squeezy webhook signature", () => {
  const secret = "test-signing-secret";
  const body = JSON.stringify({ meta: { event_name: "subscription_created" } });
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyLemonSignature(secret, body, signature), true);
  assert.equal(verifyLemonSignature(secret, `${body} `, signature), false);
  assert.equal(verifyLemonSignature(secret, body, "nope"), false);
});

test("reads a Lemon Squeezy subscription event", () => {
  const event = readLemonEvent({
    meta: {
      event_name: "subscription_created",
      custom_data: { account_id: "acc_123", plan: "monthly" },
    },
    data: {
      id: "sub_123",
      attributes: {
        status: "active",
        customer_id: 98765,
        current_period_end: "2026-11-23T00:00:00.000000Z",
        user_email: "owner@example.com",
        variant_id: 42,
      },
    },
  });
  assert.equal(event.accountId, "acc_123");
  assert.equal(event.subscriptionId, "sub_123");
  assert.equal(event.customerId, "98765");
  assert.equal(event.plan, "pro");
  assert.equal(event.variantId, "42");
});
