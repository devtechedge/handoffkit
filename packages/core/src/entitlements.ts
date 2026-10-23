export type Plan = "free" | "pro";

export interface SubscriptionState {
  plan: Plan;
  status: string;
  currentPeriodEnd?: string | Date | null;
}

export function effectivePlan(subscription?: SubscriptionState | null, now = new Date()): Plan {
  if (!subscription) return "free";
  if (subscription.plan !== "pro") return "free";
  const status = subscription.status.toLowerCase();
  if (status === "active" || status === "on_trial" || status === "past_due") return "pro";
  if (status === "cancelled" || status === "canceled") {
    if (!subscription.currentPeriodEnd) return "free";
    const end = new Date(subscription.currentPeriodEnd);
    return Number.isNaN(end.getTime()) || end.getTime() > now.getTime() ? "pro" : "free";
  }
  return "free";
}

export function packLimit(plan: Plan): number | null {
  return plan === "pro" ? null : 1;
}

export function canCreatePack(plan: Plan, existingCount: number): boolean {
  const limit = packLimit(plan);
  return limit === null || existingCount < limit;
}

export function canUseBranding(plan: Plan): boolean {
  return plan === "pro";
}

export function canHideFooter(plan: Plan): boolean {
  return plan === "pro";
}

export function planLabel(plan: Plan): string {
  return plan === "pro" ? "Pro" : "Free";
}
