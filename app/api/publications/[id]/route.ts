import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  publicError,
  publicJson,
  publicNotFound,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";

/**
 * GET /api/publications/[id]
 * Public read of a single published publication by its stable `id` field
 * (e.g. "rooted-kids-oct-2026"), not its Mongo ObjectId. Includes the full
 * document — weeks, days and interactive blocks — for embedded reading guides.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rl = rateLimit(`publication:${clientIp(request)}`);
    if (!rl.ok) {
      return publicTooMany();
    }

    const { id } = await params;
    if (!id || !/^[a-z0-9-]{1,80}$/i.test(id)) {
      return publicNotFound("Publication not found");
    }

    const db = await getDb();
    const doc = await db
      .collection("publications")
      .findOne({ id, status: "published" });

    if (!doc) {
      return publicNotFound("Publication not found");
    }

    return publicJson(doc, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error("GET /api/publications/[id] failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };