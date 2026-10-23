export function isEmail(value: string): boolean {
  if (value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export function isHttpsUrl(value: string): boolean {
  if (!value) return true;
  if (value.length > 500) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validPassword(value: string): boolean {
  return value.length >= 10 && value.length <= 200;
}

const MAX_WORKFLOW_BYTES = 512_000;

export function workflowBody(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_WORKFLOW_BYTES) return null;
  return trimmed;
}

export function safeFileName(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "handover-pack";
}
