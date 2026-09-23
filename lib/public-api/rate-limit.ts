/**
 * Best-effort in-memory rate limiting for the public developer API.
 *
 * Serverless note: the counter lives in the module scope of a warm instance,
 * so limits are enforced per-instance and reset on cold starts. That's a
 * reasonable guard for a free public API today; if abuse becomes a problem,
 * swap this for a shared store (e.g. Upstash Redis) without changing routes.
 */

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 120;

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  limit: number;
  retryAfterSec: number;
};

const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit = DEFAULT_LIMIT,
  windowMs = WINDOW_MS,
): RateLimitResult {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((windowMs - (now - hits[0])) / 1000),
    );
    return { ok: false, remaining: 0, limit, retryAfterSec };
  }

  hits.push(now);
  buckets.set(key, hits.length > limit * 2 ? hits.slice(-limit) : hits);
  return { ok: true, remaining: limit - hits.length, limit, retryAfterSec: 0 };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(
      Math.floor(Date.now() / 1000) + result.retryAfterSec,
    ),
  };
}