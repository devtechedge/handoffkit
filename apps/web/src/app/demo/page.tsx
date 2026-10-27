import type { Metadata } from "next";
import { riskyWorkflowJson, sampleWorkflowJson } from "@handoffkit/core";
import { Footer } from "@/components/Footer";
import { PackForm } from "@/components/PackForm";
import { SiteHeader } from "@/components/SiteHeader";
import { getAccount } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live demo",
  description:
    "Paste an n8n workflow or load a sample and see the HandoffKit handover pack: readiness score, AI register, workflow map and runbook.",
};

export default async function DemoPage() {
  const account = await getAccount();
  return (
    <>
      <SiteHeader signedIn={Boolean(account)} />
      <main id="main">
        <section className="page-hero">
          <div className="container narrow">
            <p className="eyebrow">Live demo</p>
            <h1>See the pack before you trust it.</h1>
            <p className="lede">
              Load the sample or paste a real n8n export. The analysis runs on the server, uses
              deterministic checks and does not call an LLM. Nothing is saved in the demo.
            </p>
            <div className="demo-points">
              <span>Readiness score</span>
              <span>AI register</span>
              <span>Data map</span>
              <span>Runbook</span>
            </div>
          </div>
        </section>

        <section className="section demo-section">
          <div className="container">
            <PackForm mode="demo" sampleJson={sampleWorkflowJson()} riskyJson={riskyWorkflowJson()} />
          </div>
        </section>

        <section className="section section-tint">
          <div className="container narrow demo-explain">
            <p className="eyebrow">What the demo does not do</p>
            <h2>It will not invent a clean handover.</h2>
            <p>
              The sample workflow already has a few real problems. The risky sample adds a
              hardcoded API key and personal data so you can see how a blocking finding looks.
              HandoffKit reports what it can see in the export. It does not execute the workflow,
              resolve credential values or promise legal compliance.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
