import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";
import { getAccount } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
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
            <p className="eyebrow">Welcome back</p>
            <h1>Pick up the handover where you left it.</h1>
            <p className="lede">
              Your packs, share links and client notes are waiting. Nothing else has changed.
            </p>
            <ul className="auth-points">
              <li>Your generated packs stay in your account.</li>
              <li>The raw workflow is not stored.</li>
              <li>Share links are unguessable and not indexed.</li>
            </ul>
          </div>
          <div className="auth-card panel">
            <h2>Sign in</h2>
            <p className="auth-sub">Use the email and password you signed up with.</p>
            <AuthForm mode="login" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
