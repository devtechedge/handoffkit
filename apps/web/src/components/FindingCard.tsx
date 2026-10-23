import type { Finding } from "@handoffkit/core";

export function FindingCard({ finding }: { finding: Finding }) {
  return (
    <article className={`finding finding-${finding.severity}`}>
      <div className="finding-head">
        <span className="severity">{finding.severity}</span>
        {finding.blocking && <span className="blocking">Blocks handover</span>}
        {finding.node && <span className="finding-node">{finding.node}</span>}
      </div>
      <h3>{finding.title}</h3>
      <p>{finding.detail}</p>
      <p className="finding-suggestion">{finding.suggestion}</p>
    </article>
  );
}
