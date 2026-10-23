import type { ReactNode } from "react";
import { getAccount } from "@/lib/auth";
import { Footer } from "./Footer";
import { SiteHeader } from "./SiteHeader";

export async function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  const account = await getAccount();
  return (
    <>
      <SiteHeader signedIn={Boolean(account)} />
      <main id="main">
        <section className="page-hero">
          <div className="container narrow">
            <p className="eyebrow">Legal</p>
            <h1>{title}</h1>
            <p className="lede">{intro}</p>
            <p className="microcopy">Last updated 23 October 2026.</p>
          </div>
        </section>
        <section className="section">
          <div className="container narrow prose">{children}</div>
        </section>
      </main>
      <Footer />
    </>
  );
}
