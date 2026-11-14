import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getClubDoc } from "@/lib/clubs";
import {
  DEFAULT_CALENDAR_YEAR,
  ORGANIZATION_CALENDAR_NAME,
  ORGANIZATION_SCOPE,
  getCalendar,
  getLatestCalendar,
} from "@/lib/program-calendar";
import { buildCalendarIcs, icsFilename } from "@/lib/calendar-ics";
import {
  publicBadRequest,
  publicError,
  publicJson,
  publicNotFound,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";

const SCOPE = /^[a-z0-9][a-z0-9-]{1,39}$/;

/**
 * GET /api/program-calendar?scope=relate&year=2027
 *
 * One year plan for the whole organization (scope=relate, the default) or for
 * a club (scope=<slug>). Club pages keep using /api/clubs/[slug]/calendar;
 * this route exists because the organization scope is not a club document.
 *
 *   &format=ics   the same year as a downloadable iCalendar file
 *   &entry=<id>   narrow an ics export to a single entry
 *
 * Without ?year= the newest published year is served, so clients never
 * hardcode one.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`program-calendar:${clientIp(request)}`);
    if (!rl.ok) return publicTooMany();

    const params = request.nextUrl.searchParams;
    const scope = (params.get("scope") || ORGANIZATION_SCOPE).trim().toLowerCase();
    if (!SCOPE.test(scope)) return publicBadRequest("A valid calendar scope is required.");

    const yearParam = params.get("year");
    if (yearParam && !/^\d{4}$/.test(yearParam)) {
      return publicBadRequest("year must be a 4-digit year.");
    }

    const db = await getDb();
    let name = ORGANIZATION_CALENDAR_NAME;
    if (scope !== ORGANIZATION_SCOPE) {
      const club = await getClubDoc(db, scope);
      if (!club) return publicNotFound("Club not found");
      name = club.name || scope;
    }

    const calendar = yearParam
      ? await getCalendar(db, scope, Number(yearParam))
      : await getLatestCalendar(db, scope);
    const year = calendar?.year ?? (Number(yearParam) || DEFAULT_CALENDAR_YEAR);
    const entries = calendar?.entries ?? [];

    if (params.get("format") === "ics") {
      const entryId = params.get("entry");
      const selected = entryId ? entries.filter((e) => e.id === entryId) : entries;
      if (entryId && selected.length === 0) return publicNotFound("Entry not found");

      const body = buildCalendarIcs({ name, scope, year, entries: selected });
      const filename = icsFilename(entryId ? `${scope}-${entryId}` : scope, year);
      return new Response(body, {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
          "Access-Control-Allow-Origin": "*",
          ...rateLimitHeaders(rl),
        },
      });
    }

    return publicJson(
      { clubSlug: scope, scope, name, year, entries },
      // Shorter than the public default: admins publish dates from the same
      // screen members read, so a new date must not sit behind a 5-minute cache.
      { maxAge: 60, headers: rateLimitHeaders(rl) },
    );
  } catch (error) {
    console.error("GET /api/program-calendar failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };