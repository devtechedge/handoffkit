import { hasDatabase, query } from "./db";

interface Bucket {
  count: number;
  resetAt: number;
}

const memory = new Map<string, Bucket>();

function memoryLimit(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const bucket = memory.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    if (memory.size > 5000) {
      for (const [entry, value] of memory) {
        if (value.resetAt <= now) memory.delete(entry);
      }
    }
    return limit >= 1;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  if (!hasDatabase()) return memoryLimit(key, limit, windowSeconds);
  try {
    const rows = await query<{ count: number }>(
      `insert into handoffkit.rate_limits (key, count, reset_at, updated_at)
       values ($1, 1, now() + make_interval(secs => $2::int), now())
       on conflict (key) do update set
         count = case when handoffkit.rate_limits.reset_at <= now() then 1 else handoffkit.rate_limits.count + 1 end,
         reset_at = case when handoffkit.rate_limits.reset_at <= now() then now() + make_interval(secs => $2::int) else handoffkit.rate_limits.reset_at end,
         updated_at = now()
       returning count`,
      [key, windowSeconds],
    );
    const count = rows[0]?.count ?? 1;
    return count <= limit;
  } catch {
    return memoryLimit(key, limit, windowSeconds);
  }
}
