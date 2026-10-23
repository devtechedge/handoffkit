"use client";

import { useState } from "react";

export function CopyButton({ value, label = "Copy link" }: { value: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
      window.setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("error");
    }
  }

  return (
    <button className="btn btn-ghost btn-sm" type="button" onClick={copy}>
      {state === "copied" ? "Copied" : state === "error" ? "Copy this link manually" : label}
    </button>
  );
}
