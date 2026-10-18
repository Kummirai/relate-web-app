import { NextRequest } from "next/server";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";
import {
  publicError,
  publicJson,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { getDb } from "@/lib/mongodb";

/**
 * GET /api/teams/{teamId}/members
 *
 * Public roster of players on a squad (Football, Netball, Volleyball) —
 * first names only, so team pages show who's actually registered for the
 * team without exposing personal details. Reads the player registrations
 * (the position-based sign-up form), so the list matches the team sheet.
 *
 * Rate-limited per IP; short cacheable so team pages stay cheap.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rl = rateLimit(`team-members:${clientIp(request)}`, 30, 60_000);
    if (!rl.ok) {
      return publicTooMany();
    }

    const { id } = await params;
    const teamId = String(id ?? "").trim().slice(0, 40);
    if (!teamId || !/^[A-Za-z0-9_-]+$/.test(teamId)) {
      return publicJson({ error: "Unknown team." }, { status: 400, maxAge: 0 });
    }

    const db = await getDb();
    const filter = { teamId, status: "active" };

    const count = await db
      .collection("sports_registrations")
      .countDocuments(filter);

    const rows = await db
      .collection("sports_registrations")
      .find(filter)
      .project({ name: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(60)
      .toArray();

    const members = rows.map((row) => ({
      firstName: String(row.name ?? "").trim().split(/\s+/)[0] || "Member",
      joinedAt:
        row.createdAt instanceof Date ? row.createdAt.toISOString() : null,
    }));

    return publicJson(
      { count, members },
      { maxAge: 30, headers: rateLimitHeaders(rl) },
    );
  } catch (e) {
    console.error("[teams/members] GET failed", e);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
