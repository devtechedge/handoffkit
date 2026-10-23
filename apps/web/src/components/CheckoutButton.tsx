"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CheckoutButton({
  plan,
  label,
}: {
  plan: "monthly" | "annual";
  label: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      let data: { error?: string; url?: string } = {};
      try {
        data = (await response.json()) as { error?: string; url?: string };
      } catch {
        data = {};
      }
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok || !data.url) {
        setMessage(data.error ?? "Checkout is not available yet.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setMessage("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn btn-primary btn-block" type="button" onClick={startCheckout} disabled={loading}>
        {loading ? "Opening checkout..." : label}
      </button>
      {message && <p className="form-error">{message}</p>}
    </div>
  );
}
