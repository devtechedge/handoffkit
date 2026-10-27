# Validation log

Rule: record the source, the date checked, what it actually says, and how strong the evidence is. Separate facts from assumptions.

## 2026-10-23 - idea scorecard

Scores are 1 to 5. Total out of 30. This is a judgement aid, not market data.

| Idea | Pain | Reach | Willing to pay | Competition gap | Buildable | Different | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| n8n agency handover plus AI register | 4 | 4 | 4 | 3 | 5 | 4 | 24 |
| AI usage compliance for agencies | 5 | 3 | 4 | 2 | 3 | 3 | 20 |
| AI coding cost tracking | 4 | 4 | 2 | 1 | 5 | 2 | 18 |
| Client document collection | 4 | 3 | 3 | 1 | 5 | 2 | 18 |
| Agency access and offboarding | 4 | 3 | 3 | 2 | 4 | 2 | 18 |
| n8n workflow testing and monitoring | 4 | 4 | 3 | 2 | 3 | 2 | 18 |
| Accessibility monitoring for agencies | 4 | 3 | 3 | 1 | 4 | 2 | 17 |
| Agency scope creep | 4 | 3 | 3 | 2 | 3 | 2 | 17 |
| Security questionnaire automation | 4 | 2 | 4 | 1 | 3 | 2 | 16 |
| AI automation monitoring | 4 | 3 | 3 | 1 | 3 | 2 | 16 |
| Postgres migration safety | 3 | 3 | 2 | 1 | 3 | 2 | 14 |

Decision: build the n8n agency handover wedge. The AI register is the differentiation, but the pack is useful even without it.

## Demand signals

### n8n community handover threads

- URL: https://community.n8n.io/t/how-do-you-hand-over-n8n-workflows-to-clients-heres-the-format-im-working-on/322030
- Checked: 2026-10-23. Thread date shown: 16 October 2026.
- What it says: an agency builder describes the handover format they are working on: plain-language summary, step-by-step, credentials, failure modes, maintenance checklist, change log. The complaint is that clients cannot read raw JSON and support calls arrive months later.
- Strength: firsthand problem statement from the target buyer. Weak on willingness to pay.

- URL: https://community.n8n.io/t/how-do-you-hand-over-n8n-workflows-to-clients/321949
- Checked: 2026-10-23. Thread date shown: 21 October 2026.
- What it says: the same handover question from a different angle, including what to include and how to keep it current.
- Strength: repeated demand within five days. Still qualitative.

### Reachable market

- URL: https://theexpertroster.com/stack/n8n
- Checked: 2026-10-23.
- What it says: 91 vetted n8n experts, split into 68 agencies and 23 solo freelancers.
- Strength: a concrete prospect list. Not all will pay.

- URL: https://experts.n8n.io/
- Checked: 2026-10-23.
- What it says: n8n Service Partner Directory.
- Strength: official directory, useful for prospecting. Need to confirm listing and contact rules before outreach.

- URL: https://theexpertroster.com/stack/make
- Checked: 2026-10-23.
- What it says: Make experts listed separately.
- Strength: expansion path after n8n.

### Existing alternatives

- URL: https://getflowdossier.netlify.app/
- Checked: 2026-10-23.
- What it says: FlowDossier is a Chrome extension that turns n8n workflow JSON into documentation. It is on a waitlist and plans a $9/month tier.
- Read: early, local-only, low price, no agency branding or AI register visible. Validates demand and leaves room above it.

- URL: https://n8n-handoff-pack.pages.dev/
- Checked: 2026-10-23.
- What it says: a local handoff pack generator with Free and Pro options.
- Read: early and self-serve. Not a hosted client portal. Price and features need a closer check before positioning.

- Manual documentation services: offers around $120 for one workflow and $450 for five were visible in search results on 2026-10-23. Treat as a price anchor for done-for-you work, not as a competitor product.

### Rejected categories and why

- AI coding cost tracking: W&B HiveMind, Scruple, CodeBurn, StackSpend, Costory, Caprock, teamspend, DX. Crowded and free tools are common.
- Accessibility monitoring: Rampsight EUR 99 for 10 sites, AccessiProof EUR 199, TLDTrack $11, GotAlt $29, Lexable EUR 16, A11y Pulse $19, WCAGAlert EUR 79. Crowded at the low end.
- Client document collection: Content Snare $35 to $143/month, Portico, and cheaper alternatives.
- Security questionnaires: Complies $119/month, 1up $300 and $900, AutoRFP $899, Conveyor $9,600/year, Loopio median $24,209, plus Vanta and Drata bundles.
- Postgres migration safety: Atlas $9 per developer and $59/month for pipelines, plus free open source.
- Agency client access and offboarding: AuthHub $29/$49/$89, AgencyAccess, Leadsie.
- Agency scope creep: Docket $79/$199.
- AI automation monitoring: Cohesiva, PolarSentry, Hellhound, RootBrief, Norevin, Burrow, ProofMyAI.

## Real workflow parser check

- Source: https://github.com/nusquama/n8nworkflows.xyz
- Checked: 2026-10-24.
- What it is: three public n8n workflow exports, used to test the parser and handover output. No customer workflow was used. No secret value is reproduced here.
- Export 1, "Onboarding": 20 nodes, 2 entry points (manual start and Google Sheets trigger) plus an error handler. 1 AI step (Google, `models/gemini-2.0-flash`). Score 56, not ready. High findings: AI can act without approval; personal data goes to AI. Medium: multiple triggers. Low: no execution timeout, orphan nodes. Info: no timezone.
- Export 2, "AI-Powered Customer Support: Email, Knowledge Base & Human Escalation Automation": 23 steps, 5 AI steps (Google and OpenAI; model names not set in the export), 2 entry points. Score 0, not ready. 11 high findings: 5 AI steps can act without approval, 5 AI steps have no failure path, 1 personal-data-to-AI finding. Medium: 5 models not visible in the export, multiple triggers, no error workflow. Low: no execution timeout, no notes, orphan nodes. Info: no timezone.
- Export 3, "CrunchBase Invester Data": 4 steps, schedule trigger, no AI. Score 78, review. Medium: HTTP request has no timeout; no error workflow. Low: HTTP request has no retry; no execution timeout. Info: no timezone. The placeholder `Bearer YOUR_CRUNCHBASE_API_KEY` is not flagged as a hardcoded secret.
- Parser fixes from this check: error triggers no longer count as entry points; a Slack human-escalation step is not treated as an approval gate; placeholder bearer tokens are ignored; connected `ai_languageModel` nodes resolve the model and provider; model, embedding, vector, loader, splitter, memory and tool nodes are resources, not AI action steps.
- Limit: export 2 hides the model names in empty model-node parameters. The pack shows the provider from the connection type and "Not set in export" for the model. That is honest, but it shows why agencies should document the model in the node or notes.
- Strength: 3 real workflows prove the parser survives messy exports and exposed four false positives. They do not prove willingness to pay. Customer workflows are still needed.
- Production check: on 2026-10-24, a fresh production account created a pack from export 2. The public page showed 5 AI steps and 11 high-severity findings. Account deletion returned 200, the share link returned 404, and login after deletion returned 401.

## Billing facts

- URL: https://docs.lemonsqueezy.com/help/getting-started/supported-countries
- Checked: 2026-10-23.
- India is listed for bank payouts with an asterisk. The footnote says Stripe has accepted new India accounts on an invite-only basis since May 2024. Without a pre-approved Stripe account, use PayPal payouts. PayPal payouts are supported in 200+ countries.
- Read: Lemon Squeezy is a viable merchant of record for an India-based seller using PayPal payouts. Store approval and payout setup still need to be tested.

- Stripe India: invite-only per the brief and the Lemon Squeezy footnote. Not assumed.
- Paddle: seller eligibility for India was not verified in this session. The page fetched was about buyer countries. Do not claim Paddle works.

## Public copy check

- Checked: 2026-10-24.
- Removed "small pilot with automation agencies" and "priority feedback line" because neither is true yet.
- Softened "every model" to "each AI step, with its provider and model where the export exposes them".
- Changed "everything the handover call needs" to "the handover call, in one page".
- No customer count, revenue, compliance certification or testimonial claim is on the public pages.
- Verified on production after deploy: the home and pricing pages no longer contain "small pilot", "priority feedback" or "everything the handover call needs".
- Git-triggered production deploy from `a3b6376` verified: health 200, signup 200, settings delete UI, pack from real export 200, public page 200 with 5 AI steps and 11 high-severity findings, delete 200, public page 404, login 401.

## Assumptions still untested

- A1: An agency spends at least 2 hours on a typical client handover.
- A2: The agency, not the client, will pay for the pack.
- A3: $49/month is acceptable for unlimited packs and branding.
- A4: Clients ask enough AI and data questions that an AI register is worth paying for.
- A5: A branded share link and PDF are more valuable than a Markdown file.
- A6: Agencies will paste a real workflow into a new tool after a short demo.

## Open questions

- Do agencies hand over one workflow per project or a bundle?
- Who signs off the handover: the agency owner, the delivery lead or the client?
- Do clients need a login, or is an unguessable link enough?
- Which compliance questions are clients actually asking in sales calls?
- Would agencies pay more for automatic re-sync with n8n than for a one-time pack?
- Is the buyer also using Make or Zapier on the same project?

## Next evidence to collect

- 20 conversations with n8n agencies. Ask for the last handover they did, the time spent, the artefact used and the questions the client asked.
- 3 real workflow exports, with permission and secrets removed, to test the parser.
- 5 client-side readers to check whether the pack is understandable without the builder present.
- A price question after the demo, not before.
