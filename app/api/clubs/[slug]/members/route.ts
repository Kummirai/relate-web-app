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
import { resolveSession, findUserById, fetchParticipants } from "@/lib/community-auth";
import { ensureClubJoinIndexes } from "@/lib/club-join";

const CLUB_JOIN_COL = "club_join_applications";

const SPROUT_SLUGS = ["sprout", "sprout-kids", "sprout-tweens", "sprout-teens"];

/**
 * GET /api/clubs/{slug}/members
 *
 * First names of active members — powers the club chat's member sheet.
 * Members only: the caller must hold an active membership for the club
 * (or be an admin). First names only, so the roster never exposes more than
 * a chat group would.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const rl = rateLimit(`club-members:${clientIp(request)}`, 30, 60_000);
    if (!rl.ok) return publicTooMany();

    const { slug } = await params;
    const clubSlug = String(slug ?? "").trim().toLowerCase().slice(0, 60);
    if (!clubSlug) {
      return publicJson({ error: "Club is required" }, { status: 400, maxAge: 0 });
    }

    const session = await resolveSession(request);
    if (!session) {
      return publicJson(
        { error: "Sign in to view members" },
        { status: 401, maxAge: 0 },
      );
    }

    const db = await getDb();
    await ensureClubJoinIndexes(db);

    const userDoc = await findUserById(db, session.id);
    const isAdmin = userDoc?.role === "admin";

    if (!isAdmin) {
      const mine = await db
        .collection(CLUB_JOIN_COL)
        .findOne(
          { userId: session.id, status: "active" },
          { sort: { createdAt: -1 }, projection: { clubSlug: 1 } },
        );
      const mySlug = String(mine?.clubSlug ?? "");
      const covered =
        mySlug === clubSlug ||
        (clubSlug === "sprout" && mySlug.startsWith("sprout-"));
      if (!covered) {
        return publicJson(
          { error: "Members only" },
          { status: 403, maxAge: 0 },
        );
      }
    }

    const filter =
      clubSlug === "sprout"
        ? { status: "active", clubSlug: { $in: SPROUT_SLUGS } }
        : { status: "active", clubSlug };

    const count = await db.collection(CLUB_JOIN_COL).countDocuments(filter);
    const rows = await db
      .collection(CLUB_JOIN_COL)
      .find(filter)
      .project({ name: 1, createdAt: 1, userId: 1 })
      .sort({ createdAt: -1 })
      .limit(60)
      .toArray();

    // Avatars live on the user record; chat bubbles key members by the same id
    // that Supabase messages carry as sender_id. fetchParticipants matches both
    // `id` and `_id` user docs, since not every record carries better-auth's id.
    const userIds = rows
      .map((row: any) => String(row.userId ?? ""))
      .filter(Boolean);
    const people = await fetchParticipants(db, userIds);

    const members = rows.map((row: any) => {
      const id = String(row.userId ?? "");
      return {
        id,
        firstName: String(row.name ?? "").trim().split(/\s+/)[0] || "Member",
        image: people.get(id)?.image ?? null,
        joinedAt:
          row.createdAt instanceof Date ? row.createdAt.toISOString() : null,
      };
    });

    return publicJson(
      { count, members },
      { maxAge: 0, headers: rateLimitHeaders(rl) },
    );
  } catch (e) {
    console.error("[clubs/members] GET failed", e);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
