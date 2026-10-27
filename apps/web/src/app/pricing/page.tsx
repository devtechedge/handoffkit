import type { Metadata } from "next";
import { lemonConfigFromEnv } from "@handoffkit/core";
import { CheckoutButton } from "@/components/CheckoutButton";
import { Footer } from "@/components/Footer";
import { LeadForm } from "@/components/LeadForm";
import { SiteHeader } from "@/components/SiteHeader";
import { accountPlan, getAccount } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "HandoffKit pricing. One free client pack. Pro is $49/month or $490/year for unlimited client handover packs.",
};

export default async function PricingPage() {
  const account = await getAccount();
  const plan = account ? accountPlan(account) : null;
  const billingOpen = Boolean(lemonConfigFromEnv());

  return (
    <>
      <SiteHeader signedIn={Boolean(account)} />
      <main id="main">
        <section className="page-hero">
          <div className="container narrow">
            <p className="eyebrow">Pricing</p>
            <h1>One clean handover is worth more than one more tool.</h1>
            <p className="lede">
              Start with a free pack. Upgrade when handovers are part of every project, not a
              once-a-quarter scramble.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="pricing-grid pricing-grid-large">
              <article className="price-card">
                <div className="price-head">
                  <div>
                    <h2>Free</h2>
                    <p className="price">$0</p>
                  </div>
                  {plan === "free" && <span className="badge badge-free">Current plan</span>}
                </div>
                <p className="price-note">For the first handover, or a quick test.</p>
                <ul className="price-list">
                  <li>One client pack</li>
                  <li>Readiness score and blocking findings</li>
                  <li>AI register</li>
                  <li>Workflow map and runbook</li>
                  <li>Share link</li>
                  <li>HandoffKit footer on the public page</li>
                </ul>
                {account ? (
                  <a className="btn btn-ghost btn-block" href="/app">
                    Open your dashboard
                  </a>
                ) : (
                  <a className="btn btn-ghost btn-block" href="/signup">
                    Start free
                  </a>
                )}
              </article>

              <article className="price-card price-card-pro">
                <div className="price-head">
                  <div>
                    <h2>Pro</h2>
                    <p className="price">
                      $49<span>/month</span>
                    </p>
                  </div>
                  {plan === "pro" && <span className="badge badge-pro">Current plan</span>}
                </div>
                <p className="price-note">For agencies handing over client work every month.</p>
                <ul className="price-list">
                  <li>Unlimited client packs</li>
                  <li>Custom agency name and accent</li>
                  <li>PDF and Markdown exports</li>
                  <li>No HandoffKit footer</li>
                </ul>

                {plan === "pro" ? (
                  <span className="btn btn-soft btn-block">You are on Pro</span>
                ) : billingOpen ? (
                  account ? (
                    <div className="checkout-stack">
                      <CheckoutButton plan="monthly" label="Upgrade monthly" />
                      <CheckoutButton plan="annual" label="Upgrade annual · $490" />
                    </div>
                  ) : (
                    <a className="btn btn-primary btn-block" href="/signup">
                      Create an account first
                    </a>
                  )
                ) : (
                  <a className="btn btn-primary btn-block" href="#early-access">
                    Join the early-access list
                  </a>
                )}

                <p className="price-small">
                  $490/year for annual billing. Prices in USD. Taxes may apply.
                </p>
              </article>
            </div>
          </div>
        </section>

        {!billingOpen && (
          <section className="section section-tint" id="early-access">
            <div className="container split">
              <div>
                <p className="eyebrow">Billing is not open yet</p>
                <h2>Pro is priced. Checkout opens after early-access testing.</h2>
                <p className="section-lede">
                  HandoffKit is in early access. Join the list if you want a slot when billing
                  opens. No newsletter, no drip sequence.
                </p>
                <p className="microcopy">
                  The product is usable now on the free plan. The paid plan is not being sold until
                  the billing flow and the client handover flow have been tested end to end.
                </p>
              </div>
              <div className="panel form-panel">
                <LeadForm source="pricing" />
              </div>
            </div>
          </section>
        )}

        <section className="section">
          <div className="container narrow faq">
            <p className="eyebrow">Questions</p>
            <h2>The honest answers.</h2>
            <details>
              <summary>Do you store my workflow?</summary>
              <p>
                No. The raw workflow is processed to build the pack and is not written to the
                database. Only the generated pack JSON and Markdown are stored.
              </p>
            </details>
            <details>
              <summary>Do you send workflow data to an LLM?</summary>
              <p>
                No. The analysis is deterministic: node types, parameters, notes and rules. There
                is no model call in the pack generation path.
              </p>
            </details>
            <details>
              <summary>Which tools are supported?</summary>
              <p>
                n8n JSON exports first. Make, Zapier and Power Automate are on the list, but they
                are not supported yet.
              </p>
            </details>
            <details>
              <summary>Is the AI register legal advice?</summary>
              <p>
                No. It is a documentation aid. Privacy and AI obligations depend on the client, the
                jurisdiction and the actual data flow. Confirm the pack with the client.
              </p>
            </details>
            <details>
              <summary>Can I cancel?</summary>
              <p>
                Yes. Pro is a monthly or annual subscription. If billing is not open yet, there is
                nothing to cancel. The refund policy is on the refunds page.
              </p>
            </details>
          </div>
        </section>

        <section className="section section-tint">
          <div className="container final-cta">
            <p className="eyebrow">Try it on one workflow</p>
            <h2>Use the free pack on the next project you close.</h2>
            <div className="hero-actions center">
              <a className="btn btn-primary" href="/signup">
                Start free
              </a>
              <a className="btn btn-ghost" href="/demo">
                See the demo
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
