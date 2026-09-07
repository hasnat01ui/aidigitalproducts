/**
 * In-memory rate limiter.
 *
 * Scope and limits, stated plainly: this is per-process. On a single instance
 * it works; across multiple instances each keeps its own counter, and it
 * resets on deploy. That is acceptable for launch traffic and for slowing
 * casual abuse — it is not a defence against a determined attacker.
 *
 * Replace with a shared store (Upstash/Redis) before running multiple
 * instances. Tracked in docs/security.md.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Bound memory: a flood of unique IPs must not grow this map without limit.
const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [k, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(k);
    }
    // Still oversized after pruning expired entries: drop everything rather
    // than leak memory. Worst case is a brief window of unlimited requests,
    // which is preferable to an unbounded map.
    if (buckets.size > MAX_TRACKED_KEYS) buckets.clear();
  }

  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { limited: false, remaining: max - 1, resetAt };
  }

  existing.count += 1;

  return {
    limited: existing.count > max,
    remaining: Math.max(0, max - existing.count),
    resetAt: existing.resetAt,
  };
}

/** Best-effort client IP from proxy headers. */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
