"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function SettingsForm({
  agencyName: initialAgencyName,
  accent: initialAccent,
  logoUrl: initialLogoUrl,
}: {
  agencyName: string;
  accent: string;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const [agencyName, setAgencyName] = useState(initialAgencyName);
  const [accent, setAccent] = useState(initialAccent);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? "");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSaved(false);
    setLoading(true);
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyName, accent, logoUrl }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Could not save settings.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setMessage("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="settings-form panel" onSubmit={handleSubmit}>
      <label className="field">
        <span>Agency or studio name</span>
        <input
          className="input"
          value={agencyName}
          onChange={(event) => setAgencyName(event.target.value)}
          maxLength={80}
          required
        />
      </label>
      <label className="field">
        <span>Pack accent colour</span>
        <div className="colour-row">
          <input
            className="colour-input"
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(accent) ? accent : "#0b6f68"}
            onChange={(event) => setAccent(event.target.value)}
            aria-label="Choose accent colour"
          />
          <input
            className="input"
            value={accent}
            onChange={(event) => setAccent(event.target.value)}
            maxLength={7}
            pattern="^#[0-9a-fA-F]{6}$"
            aria-label="Accent colour hex value"
          />
        </div>
      </label>
      <label className="field">
        <span>Logo URL <small>optional, https only</small></span>
        <input
          className="input"
          type="url"
          value={logoUrl}
          onChange={(event) => setLogoUrl(event.target.value)}
          placeholder="https://your-agency.com/logo.png"
          maxLength={500}
        />
      </label>
      {message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}
      {saved && <p className="form-success">Settings saved.</p>}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}
