import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ensurePublicationIndexes } from "@/lib/models";
import {
  asPublicArray,
  publicBadRequest,
  publicError,
  publicJson,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";

/**
 * GET /api/publications
 * Public list of published magazines & bulletins, newest first. No auth key.
 * Query params:
 *   ?club=sprout-kids  filter by club (bulletins matching clubSlug + magazines
 *                      carrying the club tag); "relate" = umbrella issues only
 *   ?kind=magazine|bulletin  filter by publication kind
 *   ?series=Relate|Rooted|Footsteps  filter by series name
 *   ?limit=N (1–100, default 100)   ?offset=N (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`publications:${clientIp(request)}`);
    if (!rl.ok) {
      return publicTooMany();
    }

    const params = request.nextUrl.searchParams;
    const club = params.get("club")?.trim() || undefined;
    const kind = params.get("kind")?.trim() || undefined;
    const series = params.get("series")?.trim() || undefined;

    const rawLimit = Number(params.get("limit") ?? 100);
    const rawOffset = Number(params.get("offset") ?? 0);
    if (!Number.isFinite(rawLimit) || !Number.isFinite(rawOffset)) {
      return publicBadRequest("limit and offset must be numbers");
    }
    const limit = Math.min(100, Math.max(1, Math.trunc(rawLimit)));
    const offset = Math.max(0, Math.trunc(rawOffset));

    if (series && !/^[a-z][a-z0-9 '-]{0,40}$/i.test(series)) {
      return publicBadRequest("series is not a valid series name");
    }

    const db = await getDb();
    await ensurePublicationIndexes();

    const query: Record<string, unknown> = { status: "published" };
    if (club && club !== "relate") {
      const upper = club.toUpperCase();
      const or: Record<string, unknown>[] = [{ clubSlug: club }];
      or.push({ kind: "magazine", tags: upper });
      query.$or = or;
    } else if (club === "relate") {
      query.clubSlug = { $exists: false };
    }
    if (kind === "magazine" || kind === "bulletin") query.kind = kind;
    if (series) query.series = series;

    const items = await db
      .collection("publications")
      .find(query)
      .sort({ publishedAt: -1, year: -1 })
      .skip(offset)
      .limit(limit)
      .project({ blocks: 0, weeks: 0 })
      .toArray();

    return publicJson(asPublicArray(items), {
      headers: rateLimitHeaders(rl),
    });
  } catch (error) {
    console.error("GET /api/publications failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };