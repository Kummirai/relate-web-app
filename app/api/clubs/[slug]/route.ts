import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getClubDoc } from "@/lib/clubs";
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
 * GET /api/clubs/[slug]
 * One full club document (works for age classes too — sprout-kids, etc.).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const rl = rateLimit(`clubs:${clientIp(request)}`);
    if (!rl.ok) return publicTooMany();

    const { slug } = await params;
    const clubSlug = String(slug || "").trim().toLowerCase();
    if (!clubSlug) return publicNotFound("Club not found");

    const db = await getDb();
    const club = await getClubDoc(db, clubSlug);
    if (!club) return publicNotFound("Club not found");

    return publicJson(club, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error("GET /api/clubs/[slug] failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
