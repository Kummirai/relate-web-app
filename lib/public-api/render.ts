/**
 * Shared helpers for the public (developer) API surface.
 *
 * Every public handler should respond through `publicJson` so responses get:
 *   - a stable JSON envelope with consistent `{error}` on failures
 *   - cache-control headers (public reads, no user-specific data)
 *   - permissive CORS (`Access-Control-Allow-Origin: *`, no credentials)
 *   - optional rate-limit headers
 */

import { NextRequest, NextResponse } from "next/server";
import { clientIp } from "./request";

const DEFAULT_MAX_AGE = 300; // seconds
const DEFAULT_STALE = 600; // seconds

type PublicJsonOptions = {
  status?: number;
  maxAge?: number;
  headers?: Record<string, string>;
};

export function publicJson(
  data: unknown,
  options: PublicJsonOptions = {},
): NextResponse {
  const { status = 200, maxAge = DEFAULT_MAX_AGE, headers = {} } = options;
  const h = new Headers();
  h.set(
    "Cache-Control",
    `public, max-age=${maxAge}, stale-while-revalidate=${DEFAULT_STALE}`,
  );
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type");
  h.set("Access-Control-Expose-Headers", "X-RateLimit-Remaining, X-RateLimit-Reset");
  for (const [key, value] of Object.entries(headers)) h.set(key, value);
  return NextResponse.json(data, { status, headers: h });
}

export function publicBadRequest(message: string): NextResponse {
  return publicJson({ error: message }, { status: 400, maxAge: 0 });
}

export function publicNotFound(message = "Not found"): NextResponse {
  return publicJson({ error: message }, { status: 404, maxAge: 0 });
}

export function publicError(): NextResponse {
  return publicJson(
    { error: "Internal server error" },
    { status: 500, maxAge: 0 },
  );
}

export function publicTooMany(): NextResponse {
  return publicJson(
    { error: "Rate limit exceeded" },
    { status: 429, maxAge: 0 },
  );
}

/** Respond to CORS preflight (simple GET requests don't need it, POST/others may). */
export function publicOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/** Strip the Mongo `_id` field so responses only carry stable public ids. */
export function stripMongoId<T>(doc: T): T {
  if (!doc || typeof doc !== "object") return doc;
  const { _id, ...rest } = doc as Record<string, unknown> & { _id?: unknown };
  void _id;
  return rest as T;
}

export function asPublicArray<T>(items: T[]): T[] {
  return items.map((item) => stripMongoId(item));
}

/**
 * Remove answer data from interactive quiz blocks so the public reading-plans
 * API doesn't give away solutions. Only strips `correctIndex`/`explain` from
 * `type === "quiz"` blocks; everything else passes through unchanged.
 */
export function sanitizePublicBlocks(blocks: unknown): unknown {
  if (!Array.isArray(blocks)) return blocks;
  return blocks.map((block) => {
    if (!block || typeof block !== "object") return block;
    const copy = { ...(block as Record<string, unknown>) };
    if (copy.type === "quiz") {
      delete copy.correctIndex;
      delete copy.explain;
    }
    return copy;
  });
}