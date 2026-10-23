import { randomUUID } from "node:crypto";
import { hasDatabase, query } from "./db";

export async function track(
  type: string,
  accountId?: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  if (!hasDatabase()) return;
  try {
    const payload = JSON.stringify(metadata).slice(0, 2000);
    await query(
      `insert into handoffkit.events (id, account_id, type, metadata)
       values ($1, $2, $3, $4::jsonb)`,
      [randomUUID(), accountId ?? null, type.slice(0, 80), payload],
    );
  } catch {
    // Analytics must never break the product.
  }
}
