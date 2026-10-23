"use client";

import { useEffect } from "react";
import { Logo } from "@/components/Logo";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="error-page">
      <div className="container narrow">
        <Logo />
        <p className="eyebrow">Something broke</p>
        <h1>This page could not finish loading.</h1>
        <p className="lede">
          The pack is safe. Try again, or go back to the dashboard if the error repeats.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary" type="button" onClick={reset}>
            Try again
          </button>
          <a className="btn btn-ghost" href="/app">
            Go to the dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
