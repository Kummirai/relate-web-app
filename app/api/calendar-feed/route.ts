import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import { ALL_SCOPES, buildCalendarFeed, icsEntries } from "@/lib/calendar-feed";
import { buildCalendarIcs, icsFilename } from "@/lib/calendar-ics";
import {
  publicBadRequest,
  publicError,
  publicJson,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";

const SCOPE = /^[a-z0-9][a-z0-9-]{1,39}$/;

/**
 * GET /api/calendar-feed?year=2027&scope=all
 *
 * One year of everything Relate runs: the published programme, community and
 * club events, plus board meetings and trainings when the caller is an admin.
 * Read-only — each source keeps its own editor.
 *
 *   &format=ics   the shared (non-governance) part as a calendar file
 *   &entry=<id>   narrow that file to one row
 *
 * The web club pages keep reading /api/clubs/[slug]/calendar; this route is the
 * merged agenda the app's Calendar screen shows.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`calendar-feed:${clientIp(request)}`);
    if (!rl.ok) return publicTooMany();

    const params = request.nextUrl.searchParams;
    const scope = (params.get("scope") || ALL_SCOPES).trim().toLowerCase();
    if (!SCOPE.test(scope)) return publicBadRequest("A valid calendar scope is required.");

    const yearParam = params.get("year");
    if (yearParam && !/^\d{4}$/.test(yearParam)) {
      return publicBadRequest("year must be a 4-digit year.");
    }
    const year = yearParam ? Number(yearParam) : new Date().getFullYear();
    if (year < 2020 || year > 2100) {
      return publicBadRequest("year must be between 2020 and 2100.");
    }

    const [db, admin] = await Promise.all([getDb(), requireAdmin(request)]);
    const feed = await buildCalendarFeed(db, { year, scope, isAdmin: !!admin });

    if (params.get("format") === "ics") {
      const entryId = params.get("entry");
      const shared = icsEntries(feed.items);
      const selected = entryId ? shared.filter((e) => e.id === entryId) : shared;
      const body = buildCalendarIcs({
        name: feed.scopeName,
        scope,
        year,
        entries: selected,
      });
      const filename = icsFilename(entryId ? `${scope}-${entryId}` : scope, year);
      return new Response(body, {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
          ...rateLimitHeaders(rl),
        },
      });
    }

    // One URL serves members and admins, so a shared cache must never hold it:
    // an admin's board meetings would otherwise leak into a member's response.
    return publicJson(feed, { maxAge: 0, headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error("GET /api/calendar-feed failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };