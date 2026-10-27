"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAccountButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (confirm !== "DELETE") return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        setMessage(data.error ?? "Could not delete the account.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setMessage("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        className="btn btn-ghost btn-sm danger-text"
        type="button"
        onClick={() => setOpen(true)}
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="danger-confirm">
      <p className="microcopy">
        This removes your account, every pack and every share link. Leads and feedback tied to
        your email are removed too. This cannot be undone.
      </p>
      <label className="field">
        <span>Type DELETE to confirm</span>
        <input
          className="input"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      {message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}
      <div className="button-row">
        <button
          className="btn btn-danger btn-sm"
          type="button"
          onClick={remove}
          disabled={loading || confirm !== "DELETE"}
        >
          {loading ? "Deleting..." : "Delete everything"}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirm("");
            setMessage("");
          }}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
