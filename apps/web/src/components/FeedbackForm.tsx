"use client";

import { useState, type FormEvent } from "react";

export function FeedbackForm({ compact = false }: { compact?: boolean }) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, email }),
      });
      let data: { error?: string } = {};
      try {
        data = (await response.json()) as { error?: string };
      } catch {
        data = {};
      }
      if (!response.ok) {
        setStatus(data.error ?? "Could not send that. Try again.");
        return;
      }
      setDone(true);
    } catch {
      setStatus("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="notice notice-success">
        <strong>Message received.</strong>
        <p>It goes straight to the builder, not a ticket queue.</p>
      </div>
    );
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>What is missing or confusing?</span>
        <textarea
          className="textarea"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={compact ? 4 : 6}
          maxLength={2000}
          placeholder="The AI register is useful, but I need..."
          required
        />
      </label>
      <label className="field">
        <span>Email <small>optional, for a reply</small></span>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@agency.com"
          maxLength={254}
        />
      </label>
      {status && (
        <p className="form-error" role="alert">
          {status}
        </p>
      )}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send feedback"}
      </button>
    </form>
  );
}
