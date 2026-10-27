"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Pack } from "@handoffkit/core";
import { PackView } from "./PackView";

export function PackForm({
  mode,
  sampleJson,
  riskyJson,
}: {
  mode: "demo" | "create";
  sampleJson: string;
  riskyJson: string;
}) {
  const router = useRouter();
  const resultRef = useRef<HTMLDivElement>(null);
  const [workflow, setWorkflow] = useState(mode === "demo" ? sampleJson : "");
  const [clientName, setClientName] = useState("");
  const [packName, setPackName] = useState("");
  const [fileName, setFileName] = useState("");
  const [pack, setPack] = useState<Pack | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function loadSample(value: string) {
    setWorkflow(value);
    setFileName("");
    setPack(null);
    setMessage("");
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      setMessage("That file is larger than 512 KB. Export a smaller workflow or remove unused nodes.");
      return;
    }
    const text = await file.text();
    setWorkflow(text);
    setFileName(file.name);
    setPack(null);
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!workflow.trim()) {
      setMessage("Paste an n8n workflow export or upload a JSON file.");
      return;
    }
    if (mode === "create" && !clientName.trim()) {
      setMessage("Add the client name so the pack is addressed correctly.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "demo" ? "/api/demo" : "/api/packs";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "demo"
            ? { workflow }
            : { workflow, clientName, packName },
        ),
      });

      let data: { error?: string; pack?: Pack; id?: string } = {};
      try {
        data = (await response.json()) as typeof data;
      } catch {
        data = {};
      }

      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }

      if (mode === "create" && data.id) {
        router.push(`/app/packs/${data.id}`);
        router.refresh();
        return;
      }

      if (data.pack) {
        setPack(data.pack);
        window.setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
    } catch {
      setMessage("Could not reach the server. Check the connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pack-form-wrap">
      <form className="pack-form panel" onSubmit={handleSubmit}>
        {mode === "create" && (
          <div className="form-row">
            <label className="field">
              <span>Client name</span>
              <input
                className="input"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="Northstar Studio"
                maxLength={120}
                required
              />
            </label>
            <label className="field">
              <span>Pack name <small>optional</small></span>
              <input
                className="input"
                value={packName}
                onChange={(event) => setPackName(event.target.value)}
                placeholder="Defaults to the workflow name"
                maxLength={120}
              />
            </label>
          </div>
        )}

        <div className="field">
          <div className="field-head">
            <span>n8n workflow export</span>
            <span className="field-hint">JSON only · 512 KB max</span>
          </div>
          <textarea
            className="textarea code-input"
            value={workflow}
            onChange={(event) => {
              setWorkflow(event.target.value);
              setPack(null);
            }}
            placeholder='Paste the workflow JSON, or use the sample. It starts with {"name": ...}'
            rows={12}
            spellCheck={false}
          />
        </div>

        <div className="form-actions">
          <label className="file-button">
            <input type="file" accept=".json,application/json" onChange={handleFile} />
            Upload JSON
          </label>
          {fileName && <span className="file-name">{fileName}</span>}
          {mode === "demo" && (
            <div className="sample-buttons">
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => loadSample(sampleJson)}>
                Load sample
              </button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => loadSample(riskyJson)}>
                Load risky sample
              </button>
            </div>
          )}
        </div>

        {message && (
          <p className="form-error" role="alert">
            {message}
          </p>
        )}

        <div className="form-submit">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading
              ? mode === "demo"
                ? "Analysing..."
                : "Building pack..."
              : mode === "demo"
                ? "Analyse this workflow"
                : "Generate client pack"}
          </button>
          <p className="microcopy">
            {mode === "demo"
              ? "The demo uses deterministic checks. Nothing is sent to an LLM."
              : "Only the generated pack is stored. The raw workflow and credential values are not saved."}
          </p>
        </div>
      </form>

      {mode === "demo" && pack && (
        <div ref={resultRef} className="demo-result">
          <div className="demo-result-head">
            <div>
              <p className="eyebrow">The generated pack</p>
              <h2>This is what your client sees.</h2>
            </div>
            <a className="btn btn-primary btn-sm" href="/pricing">
              Use it on a client
            </a>
          </div>
          <PackView pack={pack} titleAs="h2" />
        </div>
      )}
    </div>
  );
}
