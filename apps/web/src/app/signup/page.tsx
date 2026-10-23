import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";
import { getAccount } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Start free",
  description: "Create a free HandoffKit account and generate your first client handover pack.",
};

export default async function SignupPage() {
  const account = await getAccount();
  if (account) redirect("/app");

  return (
    <>
      <header className="auth-header">
        <div className="container header-inner">
          <Logo />
          <a className="btn btn-ghost btn-sm" href="/">
            Back home
          </a>
        </div>
      </header>
      <main id="main" className="auth-page">
        <div className="container auth-grid">
          <div className="auth-copy">
            <p className="eyebrow">Start free</p>
            <h1>Your first handover pack is on the house.</h1>
            <p className="lede">
              Bring one real n8n workflow. See whether a client-ready pack makes the last step of
              the project easier.
            </p>
            <ul className="auth-points">
              <li>One free pack, no credit card.</li>
              <li>No LLM call and no workflow stored.</li>
              <li>Share a clean page with the client.</li>
              <li>Upgrade only when it earns its place.</li>
            </ul>
          </div>
          <div className="auth-card panel">
            <h2>Create an account</h2>
            <p className="auth-sub">Agency name, email and a password. That is it.</p>
            <AuthForm mode="signup" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
