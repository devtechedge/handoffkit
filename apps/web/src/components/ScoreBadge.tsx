import { readinessLabel } from "@/lib/format";

export function ScoreBadge({ readiness }: { readiness: "ready" | "review" | "not_ready" }) {
  return <span className={`badge badge-${readiness}`}>{readinessLabel(readiness)}</span>;
}
