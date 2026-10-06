import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getClubDoc } from "@/lib/clubs";
import {
  DEFAULT_CALENDAR_YEAR,
  getCalendar,
  getLatestCalendar,
} from "@/lib/program-calendar";
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
 * GET /api/clubs/[slug]/calendar?year=2027
 * A club's program calendar (March → November by convention). Without ?year= the
 * newest published year is returned, so clients never hardcode one.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const rl = rateLimit(`club-calendar:${clientIp(request)}`);
    if (!rl.ok) return publicTooMany();

    const { slug } = await params;
    const clubSlug = String(slug || "").trim().toLowerCase();
    if (!clubSlug) return publicNotFound("Club not found");

    const yearParam = request.nextUrl.searchParams.get("year");
    const db = await getDb();
    // An unknown club has no calendar to serve — 404 like /api/clubs/[slug].
    const club = await getClubDoc(db, clubSlug);
    if (!club) return publicNotFound("Club not found");

    const calendar =
      yearParam && /^\d{4}$/.test(yearParam)
        ? await getCalendar(db, clubSlug, Number(yearParam))
        : await getLatestCalendar(db, clubSlug);

    if (!calendar) {
      return publicJson(
        { clubSlug, year: Number(yearParam) || DEFAULT_CALENDAR_YEAR, entries: [] },
        { headers: rateLimitHeaders(rl) },
      );
    }

    return publicJson(calendar, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error("GET /api/clubs/[slug]/calendar failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
