# Experiments

Status values: planned, running, done, stopped.

## E1. Demo to account

Status: planned.
Question: will an agency paste a real n8n workflow into a public demo and then create an account?
Setup: landing page CTA to `/demo`. Demo accepts JSON, returns a pack, then offers a free account.
Metric: unique visitors who generate a demo pack, and demo generators who sign up.
Threshold: 40% of demo generators create an account within 7 days.
Stop if: under 15% after 200 demo sessions.

## E2. Twenty targeted conversations

Status: planned. Blocked on Dev approval for the outreach text and list.
Question: is handover painful enough to book a call and share a real workflow?
Setup: 20 personalised messages to n8n agencies from the public directories. Offer a free pack for one real workflow. No mass email.
Metric: replies, calls booked, real workflows shared.
Threshold: 6 replies, 3 calls, 2 real workflows.
Stop if: 20 messages produce fewer than 2 replies.

## E3. Paid pilot

Status: planned.
Question: will an agency pay $49/month after receiving a useful pack?
Setup: after a real pack, ask for a card or a written commitment to a 14-day paid pilot.
Metric: paid pilots and written commitments.
Threshold: 2 paid pilots at $49/month, or 1 at $99/month, within 30 days.
Stop if: zero payment conversations after 3 real packs.

## E4. Community post

Status: planned. Blocked on Dev approval and community rules.
Question: does the n8n community respond to a build-in-public handover pack?
Setup: a useful post that shows the format and asks for critique, not a launch ad.
Metric: comments, DMs, demo sessions.
Threshold: 5 substantive comments or 3 DMs.
Stop if: post is removed or gets no engagement after 72 hours.

## E5. Price signal

Status: planned.
Question: is $49/month the right entry price?
Setup: after the demo, show $49/month and $490/year. Ask whether it is a fair price for unlimited packs.
Metric: stated willingness to pay, objections, requested features.
Threshold: at least 3 of 10 say it is fair or cheap without prompting.
Stop if: most say it is too expensive for a documentation tool.

## E6. Client readability

Status: planned.
Question: can the client's operations lead understand the pack without the builder?
Setup: give 5 client-side readers a pack and ask them to explain the trigger, the data, the AI step and what to do when it fails.
Metric: correct answers and confusing sections.
Threshold: 4 of 5 answer all four correctly.
Stop if: fewer than 3 of 5 can explain the trigger.

## Experiment discipline

- Record the date, sample size, exact prompt or copy, and raw counts.
- Do not count page views as demand.
- Do not count verbal "this looks useful" as a paid commitment.
- A failed experiment is a result. Write it down before changing the product.
