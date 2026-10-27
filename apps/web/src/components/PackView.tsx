import type { CSSProperties } from "react";
import type { Pack } from "@handoffkit/core";
import { formatDate, readinessLabel } from "@/lib/format";
import { FindingCard } from "./FindingCard";

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  return `${(value / 1024).toFixed(1)} KB`;
}

function hasCustomErrorHandling(value: string): boolean {
  return /^(Routes|Continues|Retries)/.test(value);
}

export function PackView({
  pack,
  accent,
  titleAs = "h1",
}: {
  pack: Pack;
  accent?: string | null;
  titleAs?: "h1" | "h2";
}) {
  const Title = titleAs;
  const style = {
    "--score": pack.score,
    ...(accent ? { "--accent": accent } : {}),
  } as CSSProperties;

  const runbook: Array<[string, string[]]> = [
    ["Start", pack.runbook.start],
    ["Test", pack.runbook.test],
    ["Monitor", pack.runbook.monitor],
    ["When it fails", pack.runbook.failures],
    ["When it changes", pack.runbook.change],
  ];

  return (
    <article className="pack" style={style}>
      <header className="pack-hero">
        <div className="pack-hero-main">
          <p className="eyebrow">
            {pack.agencyName} · client handover
          </p>
          <Title className="pack-title">{pack.packName}</Title>
          <p className="pack-subtitle">
            Prepared for {pack.clientName} · {formatDate(pack.generatedAt)}
          </p>
          <p className="pack-summary">{pack.summary}</p>
          <div className="pack-meta">
            <span>{pack.workflow.nodeCount} nodes</span>
            <span>{pack.workflow.integrationCount} integrations</span>
            <span>{pack.workflow.aiNodeCount} AI steps</span>
            <span>{pack.workflow.credentialCount} credentials</span>
          </div>
        </div>
        <div
          className={`score-dial score-${pack.readiness}`}
          aria-label={`Readiness score ${pack.score} out of 100. ${readinessLabel(pack.readiness)}.`}
        >
          <div className="score-inner">
            <strong>{pack.score}</strong>
            <span>readiness</span>
          </div>
        </div>
      </header>

      <div className="pack-body">
        <section className="pack-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Before handover</p>
              <h2>What needs attention</h2>
            </div>
            <span className="count-pill">
              {pack.findings.length} finding{pack.findings.length === 1 ? "" : "s"}
            </span>
          </div>
          {pack.findings.length > 0 ? (
            <div className="finding-list">
              {pack.findings.map((finding) => (
                <FindingCard key={finding.code + finding.title} finding={finding} />
              ))}
            </div>
          ) : (
            <p className="empty-inline">
              No blocking issues were detected. Confirm the inferred details with the client before sign-off.
            </p>
          )}
        </section>

        {pack.aiSystems.length > 0 && (
          <section className="pack-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">AI register</p>
                <h2>What the AI does</h2>
              </div>
              <span className="count-pill">
                {pack.aiSystems.length} system{pack.aiSystems.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="section-lede">
              Each AI step is recorded with its provider, model, purpose, data exposure and human
              oversight. This is the part clients ask about after the handover call.
            </p>
            <div className="ai-grid">
              {pack.aiSystems.map((ai, index) => (
                <article className="ai-card" key={`${ai.node}-${index}`}>
                  <div className="ai-card-head">
                    <div>
                      <span className="tag">{ai.provider}</span>
                      <h3>{ai.node}</h3>
                    </div>
                    <span className={`badge ${ai.canAct ? "badge-not_ready" : "badge-ready"}`}>
                      {ai.canAct ? "Can take action" : "Read-only path"}
                    </span>
                  </div>
                  <dl className="detail-list">
                    <div>
                      <dt>Model</dt>
                      <dd>{ai.model}</dd>
                    </div>
                    <div>
                      <dt>Purpose</dt>
                      <dd>{ai.purpose}</dd>
                    </div>
                    <div>
                      <dt>Human oversight</dt>
                      <dd>{ai.humanOversight}</dd>
                    </div>
                    <div>
                      <dt>Failure handling</dt>
                      <dd>{ai.failureHandling}</dd>
                    </div>
                  </dl>
                  <div className="chip-row">
                    {ai.dataCategories.map((category) => (
                      <span className="chip" key={category}>
                        {category}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="pack-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The build</p>
              <h2>Workflow map</h2>
            </div>
            <span className="count-pill">{pack.steps.length} steps</span>
          </div>
          <ol className="flow-list">
            {pack.steps.map((step, index) => (
              <li className={`flow-step ${step.disabled ? "is-disabled" : ""}`} key={`${step.name}-${index}`}>
                <span className="flow-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="flow-main">
                  <div className="flow-title">
                    <h3>{step.name}</h3>
                    <span className="tag">{step.role}</span>
                    {step.disabled && <span className="badge badge-not_ready">Disabled</span>}
                  </div>
                  <p className="flow-type">{step.type}</p>
                  {step.notes && <p className="flow-notes">{step.notes}</p>}
                  {hasCustomErrorHandling(step.errorHandling) && (
                    <p className="flow-error">{step.errorHandling}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="pack-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Access and exposure</p>
              <h2>Data and credentials</h2>
            </div>
          </div>
          <div className="pack-split">
            <div className="subpanel">
              <div className="subpanel-head">
                <h3>Data categories</h3>
                <span className="count-pill">{pack.dataCategories.length}</span>
              </div>
              {pack.dataCategories.length > 0 ? (
                <div className="data-list">
                  {pack.dataCategories.map((category) => (
                    <div className="data-card" key={category.key}>
                      <div className="data-card-head">
                        <h4>{category.label}</h4>
                        {category.sensitive && <span className="badge badge-review">Sensitive</span>}
                      </div>
                      <ul>
                        {category.evidence.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-inline">
                  No personal data categories were detected from the export. Confirm the data flow
                  with the client.
                </p>
              )}
            </div>

            <div className="subpanel">
              <div className="subpanel-head">
                <h3>Credentials and access</h3>
                <span className="count-pill">{pack.credentials.length}</span>
              </div>
              {pack.credentials.length > 0 ? (
                <div className="credential-list">
                  {pack.credentials.map((credential) => (
                    <div className="credential" key={`${credential.type}-${credential.name}`}>
                      <div>
                        <p className="credential-name">{credential.name}</p>
                        <p className="credential-type">{credential.type}</p>
                      </div>
                      <p className="credential-nodes">Used by {credential.nodes.join(", ")}</p>
                      <p className="credential-guidance">{credential.guidance}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-inline">No credential references were found in the export.</p>
              )}
            </div>
          </div>
        </section>

        <section className="pack-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Day two</p>
              <h2>Runbook</h2>
            </div>
          </div>
          <div className="runbook-grid">
            {runbook.map(([label, items]) => (
              <div className="runbook-block" key={label}>
                <h3>{label}</h3>
                <ul>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="pack-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Sign-off</p>
              <h2>Handover checklist</h2>
            </div>
          </div>
          <ul className="checklist">
            {pack.checklist.map((item) => (
              <li key={item}>
                <span className="check-box" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {pack.notes.length > 0 && (
          <section className="pack-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">From the build</p>
                <h2>Agency notes</h2>
              </div>
            </div>
            <div className="note-grid">
              {pack.notes.map((note, index) => (
                <article className="note-card" key={`${note.title}-${index}`}>
                  <h3>{note.title}</h3>
                  {note.content.split("\n").map((line, lineIndex) => (
                    <p key={lineIndex}>{line}</p>
                  ))}
                </article>
              ))}
            </div>
          </section>
        )}

        {Object.keys(pack.settings).length > 0 && (
          <section className="pack-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Configuration</p>
                <h2>Workflow settings</h2>
              </div>
            </div>
            <dl className="settings-list">
              {Object.entries(pack.settings).map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="pack-limitations">
          <h2>What this pack cannot see</h2>
          <ul>
            {pack.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="pack-footer">
        <span>
          Generated from an n8n export ({formatBytes(pack.source.bytes)}) on {formatDate(pack.generatedAt)}.
        </span>
        <span>HandoffKit never stores credential values.</span>
      </footer>
    </article>
  );
}
