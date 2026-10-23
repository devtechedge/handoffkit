import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getAccount } from "@/lib/auth";

export default async function NotFoundPage() {
  const account = await getAccount();
  return (
    <>
      <SiteHeader signedIn={Boolean(account)} />
      <main id="main" className="not-found">
        <div className="container narrow">
          <p className="eyebrow">404</p>
          <h1>This page moved on.</h1>
          <p className="lede">
            The pack may have been deleted, or the link may be incomplete. Ask the sender for a
            fresh share link.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="/">
              Back home
            </a>
            <a className="btn btn-ghost" href="/demo">
              Try the demo
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
