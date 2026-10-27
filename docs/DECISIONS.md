# Decisions

Newest last. Each entry records the decision, why, what was rejected and what would change our mind.

## D1. Build a separate product, not another keyward feature

Date: 2026-10-23.
Decision: HandoffKit is a separate repo and product.
Why: keyward is AI key governance. The evidence says that market is commoditised and capped around $99/month. Adding handover docs there would confuse the buyer and inherit a crowded positioning.
Rejected: extend keyward with a documentation tab.
Revisit if: HandoffKit fails and keyward customers explicitly ask for client-facing documentation.

## D2. Start with automation agency handover, not generic documentation

Date: 2026-10-23.
Decision: The wedge is client handover packs for agencies that build n8n workflows, with an AI usage register.
Why: concrete buyer, concrete trigger event (project handover), fresh demand signals, and a differentiated AI angle. Generic documentation tools are crowded.
Rejected: general SOP writer, generic AI documentation, another AI chat wrapper.
Revisit if: agencies say handover is not painful enough to pay for, but AI procurement questions are.

## D3. n8n JSON first

Date: 2026-10-23.
Decision: MVP imports n8n workflow JSON only. Make and Zapier are later.
Why: n8n exports are structured and public, the community is reachable, and the handover complaint is documented there. One import done well beats three shallow ones.
Rejected: all-platform importer in v1.
Revisit if: most prospects use Make or Zapier and cannot trial the product with real work.

## D4. Deterministic analysis, no LLM

Date: 2026-10-23.
Decision: Parse and analyse the workflow with rules. No model calls in the MVP.
Why: lower cost, predictable output, no data sent to a third party, no hallucinated claims, testable. The value is structure and presentation, not prose generation.
Rejected: LLM-written summaries.
Revisit if: users ask for narrative tailoring that rules cannot produce, and the cost and privacy story is clear.

## D5. Next.js 16, Neon Postgres, email/password auth

Date: 2026-10-23.
Decision: Reuse the proven keyward stack: Next.js 16, React 19, TypeScript, `@neondatabase/serverless`. Add scrypt password hashing and database-backed sessions.
Why: known deployment path on Vercel, no new auth vendor, no email provider needed for the MVP. Tenant isolation is enforced in SQL.
Rejected: passwordless email (needs a provider), GitHub OAuth (needs an OAuth app), third-party auth (extra account and keys).
Revisit if: paid users need SSO or GitHub sign-in, or email verification becomes a launch requirement.

## D6. Lemon Squeezy as the first billing provider

Date: 2026-10-23.
Decision: Integrate Lemon Squeezy checkout and webhooks. Keep checkout disabled until store, variant and signing secret exist.
Why: merchant of record, subscriptions, and India is supported. India bank payouts through Stripe are invite-only, but PayPal payouts are available. That is a workable path without assuming Stripe India access.
Rejected: Stripe India (invite-only), Paddle (seller eligibility for India not verified in this session).
Revisit if: Lemon Squeezy rejects the store or PayPal payouts are impractical.

## D7. Free and Pro only

Date: 2026-10-23.
Decision: Free (1 pack) and Pro at $49/month or $490/year. No Agency tier yet.
Why: a simple price is easier to validate. $49 x 40 = $2,000 MRR. An Agency tier without team features would be fake segmentation.
Rejected: $19/$49/$99 ladder with unbuilt features.
Revisit after 10 paying customers or repeated requests for seats and multiple brands.

## D8. PDF with pdf-lib, not a browser print flow

Date: 2026-10-23.
Decision: Generate a real PDF server-side with `pdf-lib`. The share page also has a print stylesheet.
Why: a direct download is a product feature, not a browser instruction. `pdf-lib` is pure JavaScript, works on Vercel, and needs no headless browser.
Rejected: Playwright/Puppeteer on Vercel, paid PDF APIs, print-only export.
Revisit if: layout requirements exceed what pdf-lib can do.

## D9. Brand: HandoffKit, live on a Vercel subdomain first

Date: 2026-10-23.
Decision: Product name HandoffKit. Repo `devtechedge/handoffkit`. Use `handoffkit-seven.vercel.app` until a domain is bought.
Why: clear, descriptive, npm and GitHub names are available. `handoffkit.com` is registered, but `handoffkit.dev`, `.app`, `.io` and `.co` had no RDAP record on 2026-10-23. No purchase yet.
Rejected: Runbookly (`runbookly.com` is registered and in redemption), FlowDossier (competitor), generic "Handoff" names with taken domains.
Revisit before paid launch: buy `handoffkit.dev` or `handoffkit.app`, run a trademark and web collision check.

## D10. Share links are unguessable and noindex

Date: 2026-10-23.
Decision: Public pack IDs are 24 random bytes encoded as URL-safe text. Share pages send `noindex, nofollow` and are not listed.
Why: packs can contain client names and credential names. A link should be easy to send and hard to discover.
Rejected: sequential IDs, public directory of packs.
Revisit if: agencies want a password on share links. Add it as a Pro feature later.

## D11. No legal compliance claims

Date: 2026-10-23.
Decision: The AI register is a documentation aid. Copy says it maps common transparency questions and is not legal advice.
Why: EU AI Act obligations depend on role, use case and jurisdiction. A generated pack cannot certify compliance.
Rejected: "EU AI Act compliant" badge.
Revisit only with a lawyer-reviewed methodology and a named audit partner.

## D12. Do not post or email prospects without approval

Date: 2026-10-23.
Decision: Prepare outreach and community drafts, but do not send them until Dev approves the text and the target list.
Why: reputation risk, community rules vary, and the brief forbids spam.
Revisit: standing approval for a defined list and template.

## D13. Shared Neon database, isolated schema

Date: 2026-10-23.
Decision: Use the existing Vercel/Neon database from the keyward project with a dedicated `handoffkit` schema and fully qualified table names.
Why: no new database account or CLI login is available, and this keeps data separate at the schema level.
Rejected: new Neon project (needs account access), SQLite (no durable serverless storage).
Revisit before paid launch: move to a dedicated Neon project and separate credentials.

## D14. Self-serve account deletion

Date: 2026-10-24.
Decision: Add `DELETE /api/account` with a typed `DELETE` confirmation. It removes the account, sessions, packs, projects and subscriptions, plus feedback, leads and usage events tied to the account. Pro accounts must cancel first.
Why: privacy promises need a working path, not an email request. The typed confirmation makes an accidental click less likely.
Rejected: email-only deletion, soft delete that leaves share links live.
Revisit when Lemon Squeezy checkout opens: add a direct billing portal link before deletion.
