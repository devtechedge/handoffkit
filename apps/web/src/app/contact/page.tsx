import type { Metadata } from "next";
import { FeedbackForm } from "@/components/FeedbackForm";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getAccount } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the builder behind HandoffKit.",
};

export default async function ContactPage() {
  const account = await getAccount();
  return (
    <>
      <SiteHeader signedIn={Boolean(account)} />
      <main id="main">
        <section className="page-hero">
          <div className="container narrow">
            <p className="eyebrow">Contact</p>
            <h1>Tell us what the handover is missing.</h1>
            <p className="lede">
              Product questions, billing questions and security reports all go to the same place.
              Include the email on your account if it is account-specific.
            </p>
          </div>
        </section>
        <section className="section">
          <div className="container split">
            <div className="panel form-panel">
              <FeedbackForm />
            </div>
            <aside className="contact-side">
              <h2>What to include</h2>
              <ul className="checklist plain">
                <li><span className="check-box" aria-hidden="true" />The email on your account</li>
                <li><span className="check-box" aria-hidden="true" />What you were trying to do</li>
                <li><span className="check-box" aria-hidden="true" />What happened instead</li>
                <li><span className="check-box" aria-hidden="true" />A screenshot, if it helps</li>
              </ul>
              <p className="microcopy">
                Do not send a workflow that contains live credentials. The pack never needs them.
              </p>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
