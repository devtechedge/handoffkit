"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeletePackButton({ id }: { id: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!window.confirm("Delete this pack? The share link will stop working.")) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/packs/${id}`, { method: "DELETE" });
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setMessage(data.error ?? "Could not delete the pack.");
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      setMessage("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span>
      <button className="btn btn-ghost btn-sm danger-text" type="button" onClick={remove} disabled={loading}>
        {loading ? "Deleting..." : "Delete"}
      </button>
      {message && <span className="inline-error">{message}</span>}
    </span>
  );
}
