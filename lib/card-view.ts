import type { NextRequest } from "next/server";
import type { Db } from "mongodb";

// Card payloads carry no per-user fields, so a single entry serves every
// viewer and can sit in the shared CDN cache. TTL matches the full-list
// caches so a card never goes staler than the screen it replaces.
export const CARD_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
};

const CARD_TTL = 30_000;
const MAX_KEYS = 32;

const caches = new Map<string, { data: any[]; ts: number }>();

/** Opt-in lean payload for list rails: ?view=card */
export function isCardView(request: NextRequest) {
  return request.nextUrl.searchParams.get("view") === "card";
}

export async function readCards(
  db: Db,
  collection: string,
  request: NextRequest,
  projection: Record<string, 1>,
) {
  const club =
    request.nextUrl.searchParams.get("club")?.trim().toLowerCase() || "";
  const raw = Number(request.nextUrl.searchParams.get("limit"));
  const limit =
    Number.isFinite(raw) && raw > 0 ? Math.min(100, Math.floor(raw)) : 100;

  const key = `${collection}|${club}|${limit}`;
  const hit = caches.get(key);
  if (hit && Date.now() - hit.ts < CARD_TTL) return hit.data;

  // clubSlug is lowercased on write, so this stays an indexed equality match.
  const data = await db
    .collection(collection)
    .find(club ? { clubSlug: club } : {}, { projection })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  if (caches.size >= MAX_KEYS) caches.clear();
  caches.set(key, { data, ts: Date.now() });
  return data;
}

export function invalidateCards(collection: string) {
  const prefix = `${collection}|`;
  for (const key of caches.keys()) {
    if (key.startsWith(prefix)) caches.delete(key);
  }
}