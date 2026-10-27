import { getAccount } from "@/lib/auth";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

const features = [
  {
    number: "01",
    title: "A readiness score",
    body: "A plain score out of 100, with blocking findings first. No vague audit language.",
  },
  {
    number: "02",
    title: "An AI register",
    body: "Each AI step, with its provider and model where the export exposes them, plus purpose, data categories and human gate.",
  },
  {
    number: "03",
    title: "A workflow map",
    body: "Each node in a readable order, with its role, error handling and the notes the next maintainer needs.",
  },
  {
    number: "04",
    title: "Data and credentials",
    body: "What personal data appears to move, which credentials the workflow uses and who should own them.",
  },
  {
    number: "05",
    title: "A runbook",
    body: "How to start it, test it, monitor it and what to do when it fails or changes.",
  },
  {
    number: "06",
    title: "A share link and PDF",
    body: "Send one branded page. Export the same pack when the client wants a file.",
  },
];

export default async function HomePage() {
  const account = await getAccount();
  return (
    <>
      <SiteHeader signedIn={Boolean(account)} />
      <main id="main">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Client handover for automation agencies</p>
              <h1>
                Hand over the workflow.
                <span className="accent-line">Not the mess.</span>
              </h1>
              <p className="lede">
                HandoffKit turns an exported n8n workflow into a client-ready handover pack: what
                it does, which AI it uses, what data it touches and what to check before sign-off.
              </p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="/demo">
                  See a sample handover
                </a>
                <a className="btn btn-ghost" href="/signup">
                  Start free
                </a>
              </div>
              <p className="microcopy">
                One free pack. No credit card. The analysis is deterministic and no workflow is
                sent to an LLM.
              </p>
            </div>

            <div className="preview-wrap" aria-label="Example HandoffKit pack">
              <div className="preview-card">
                <div className="preview-bar">
                  <span className="preview-dot" />
                  <span>northstar.studio / client handover</span>
                </div>
                <div className="preview-top">
                  <div>
                    <p className="eyebrow">Lead qualifier</p>
                    <h2>Inbound lead router</h2>
                    <p className="preview-client">Prepared for Northstar Studio</p>
                  </div>
                  <div className="score-dial score-review is-small" aria-hidden="true">
                    <div className="score-inner">
                      <strong>77</strong>
                      <span>readiness</span>
                    </div>
                  </div>
                </div>
                <div className="preview-block">
                  <p className="preview-label">AI register</p>
                  <p>
                    <strong>OpenAI</strong> · gpt-4o-mini
                  </p>
                  <p className="preview-muted">
                    Extracts intent from inbound email and writes a summary to the CRM.
                  </p>
                  <div className="chip-row">
                    <span className="chip">Email addresses</span>
                    <span className="chip">Names</span>
                  </div>
                </div>
                <div className="preview-finding">
                  <span className="severity">high</span>
                  <p>AI can take action without a human gate</p>
                </div>
                <div className="preview-footer">
                  <span>Generated from n8n JSON</span>
                  <span>4.2 KB</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="product">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">The handover gap</p>
              <h2>The workflow works. The handover is a folder of screenshots.</h2>
              <p className="section-lede">
                Automation work is technical. A client handover has to be readable by the person
                who signs the invoice, the person who owns the account and the next person who
                touches the build.
              </p>
            </div>
            <div className="grid-3">
              <article className="feature-card">
                <span className="feature-num">A</span>
                <h3>The client cannot see the logic</h3>
                <p>
                  A JSON export is not a handover. The client needs the trigger, the steps, the
                  data flow and the failure path in one place.
                </p>
              </article>
              <article className="feature-card">
                <span className="feature-num">B</span>
                <h3>AI use is undocumented</h3>
                <p>
                  Which model? What data goes in? Can it act on its own? These are the questions
                  that turn a handover call into another week of work.
                </p>
              </article>
              <article className="feature-card">
                <span className="feature-num">C</span>
                <h3>The next agency starts from zero</h3>
                <p>
                  Without a runbook and a credential map, every change becomes a rescue project.
                  The client pays twice for the same knowledge.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section section-tint">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">What a pack covers</p>
              <h2>The handover call, in one page.</h2>
            </div>
            <div className="grid-3 features-grid">
              {features.map((feature) => (
                <article className="feature-card" key={feature.number}>
                  <span className="feature-num">{feature.number}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container split">
            <div>
              <p className="eyebrow">How it works</p>
              <h2>Export. Generate. Share.</h2>
              <p className="section-lede">
                No new documentation tool for the client to learn. No screenshots to stitch
                together. The workflow export is the source.
              </p>
              <div className="steps">
                <div className="step-row">
                  <span className="step-num">1</span>
                  <div>
                    <h3>Export the n8n workflow</h3>
                    <p>Download the JSON from n8n. Credential values are not in the export.</p>
                  </div>
                </div>
                <div className="step-row">
                  <span className="step-num">2</span>
                  <div>
                    <h3>Generate the pack</h3>
                    <p>
                      HandoffKit reads the nodes, parameters and notes. It does not execute the
                      workflow or call a model.
                    </p>
                  </div>
                </div>
                <div className="step-row">
                  <span className="step-num">3</span>
                  <div>
                    <h3>Send one link</h3>
                    <p>
                      The client sees a clean handover page. You keep the PDF, Markdown and the
                      checklist for your own records.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <aside className="callout">
              <p className="eyebrow">The differentiator</p>
              <blockquote>
                “If you build with AI, your client will ask what the AI does. Answer it in the
                handover, not in a Slack thread.”
              </blockquote>
              <p>
                The AI register records the model, the purpose, the data categories, the human
                oversight and whether the AI can take action. It is generated from the workflow,
                then reviewed by you before it is shared.
              </p>
              <a className="text-link" href="/demo">
                Open the live demo <span aria-hidden="true">→</span>
              </a>
            </aside>
          </div>
        </section>

        <section className="section section-tint" id="pricing">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Simple pricing</p>
              <h2>Start with one handover. Upgrade when it earns its place.</h2>
              <p className="section-lede">
                Pro is for agencies that hand over client work every month. Billing opens after
                early-access testing.
              </p>
            </div>
            <div className="pricing-grid">
              <article className="price-card">
                <div className="price-head">
                  <h3>Free</h3>
                  <p className="price">$0</p>
                </div>
                <p className="price-note">One client pack to test the workflow.</p>
                <ul className="price-list">
                  <li>One pack</li>
                  <li>Readiness score and findings</li>
                  <li>AI register and workflow map</li>
                  <li>Share link</li>
                  <li className="muted-item">HandoffKit footer</li>
                </ul>
                <a className="btn btn-ghost btn-block" href="/signup">
                  Start free
                </a>
              </article>
              <article className="price-card price-card-pro">
                <div className="price-head">
                  <h3>Pro</h3>
                  <p className="price">
                    $49<span>/month</span>
                  </p>
                </div>
                <p className="price-note">For agencies handing over work every month.</p>
                <ul className="price-list">
                  <li>Unlimited client packs</li>
                  <li>Custom agency name and accent</li>
                  <li>PDF and Markdown exports</li>
                  <li>No HandoffKit footer</li>
                </ul>
                <a className="btn btn-primary btn-block" href="/pricing">
                  See Pro
                </a>
              </article>
            </div>
            <p className="pricing-footnote">
              $490/year for annual billing. Prices in USD. Taxes may apply.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container final-cta">
            <p className="eyebrow">The next handover</p>
            <h2>Make the last step of the project feel finished.</h2>
            <p className="section-lede">
              Bring one real workflow. The free pack will show you whether this belongs in your
              handover process.
            </p>
            <div className="hero-actions center">
              <a className="btn btn-primary" href="/signup">
                Create your first pack
              </a>
              <a className="btn btn-ghost" href="/demo">
                Try the demo
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
