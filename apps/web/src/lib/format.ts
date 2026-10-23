export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function readinessLabel(readiness: "ready" | "review" | "not_ready"): string {
  if (readiness === "ready") return "Ready to hand over";
  if (readiness === "review") return "Review before handover";
  return "Not ready yet";
}

export function planLabel(plan: "free" | "pro"): string {
  return plan === "pro" ? "Pro" : "Free";
}
