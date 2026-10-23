"use client";

import { useState, type FormEvent } from "react";

export function LeadForm({ source = "pricing" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, note, source }),
      });
      let data: { error?: string } = {};
      try {
        data = (await response.json()) as { error?: string };
      } catch {
        data = {};
      }
      if (!response.ok) {
        setMessage(data.error ?? "Could not add you to the list. Try again.");
        return;
      }
      setDone(true);
    } catch {
      setMessage("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="notice notice-success">
        <strong>You are on the list.</strong>
        <p>We will reach out when a pilot slot opens. No newsletter, no drip sequence.</p>
      </div>
    );
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <div className="field">
        <span>Work email</span>
        <div className="inline-form">
          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@agency.com"
            aria-label="Work email"
            required
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Adding..." : "Join the list"}
          </button>
        </div>
      </div>
      <label className="field">
        <span>What are you handing over? <small>optional</small></span>
        <input
          className="input"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="n8n workflows for a client, a retainer, a rescue project..."
          maxLength={300}
        />
      </label>
      {message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}
      <p className="microcopy">One email when billing opens. Your address is not shared.</p>
    </form>
  );
}
