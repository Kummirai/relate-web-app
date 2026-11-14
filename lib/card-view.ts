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

/** Opt-in lean payload for activity lists: ?view=summary */
export function isSummaryView(request: NextRequest) {
  return request.nextUrl.searchParams.get("view") === "summary";
}

// Summary rows carry per-viewer flags, so no proxy or CDN may share them.
export const SUMMARY_CACHE_HEADERS = {
  "Cache-Control": "private, no-store",
};

function readScope(request: NextRequest) {
  const club =
    request.nextUrl.searchParams.get("club")?.trim().toLowerCase() || "";
  const raw = Number(request.nextUrl.searchParams.get("limit"));
  const limit =
    Number.isFinite(raw) && raw > 0 ? Math.min(100, Math.floor(raw)) : 100;
  return { club, limit };
}

/**
 * Projected find with no participant, comment or registration joins — the
 * read behind both lean views. clubSlug is lowercased on write, so the club
 * filter stays an equality match on the { clubSlug, createdAt } index.
 */
export async function readProjected(
  db: Db,
  collection: string,
  request: NextRequest,
  projection: Record<string, 1>,
) {
  const { club, limit } = readScope(request);
  return db
    .collection(collection)
    .find(club ? { clubSlug: club } : {}, { projection })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function readCards(
  db: Db,
  collection: string,
  request: NextRequest,
  projection: Record<string, 1>,
) {
  const { club, limit } = readScope(request);
  const key = `${collection}|${club}|${limit}`;
  const hit = caches.get(key);
  if (hit && Date.now() - hit.ts < CARD_TTL) return hit.data;

  const data = await readProjected(db, collection, request, projection);

  if (caches.size >= MAX_KEYS) caches.clear();
  caches.set(key, { data, ts: Date.now() });
  return data;
}

// Raw id arrays and owner markers kept on a cached row so per-viewer flags can
// be re-derived without a refetch. They duplicate ids already on the row and
// no client reads them, so they never belong in a response.
const INTERNAL_KEYS = new Set([
  "_rsvpUserIds",
  "_joinedUserIds",
  "_connectedUserIds",
  "_ownerUserId",
  "_ownerAuthor",
]);

export function stripInternal(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    if (!INTERNAL_KEYS.has(key)) out[key] = row[key];
  }
  return out;
}

export function invalidateCards(collection: string) {
  const prefix = `${collection}|`;
  for (const key of caches.keys()) {
    if (key.startsWith(prefix)) caches.delete(key);
  }
}