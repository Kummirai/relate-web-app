import { NextRequest } from "next/server";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";
import {
  publicError,
  publicJson,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { getLatestMembership } from "@/lib/club-join";
import { resolveUser } from "@/lib/community-auth";

/**
 * GET /api/club-join/me
 *   → { data: <latest membership> | null } for the signed-in account.
 *   Runs the age-out promotion first, so the answer is the club the member
 *   belongs to today. Used to auto-fill the join form and to show the
 *   membership card.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`club-join-me:${clientIp(request)}`, 30, 60_000);
    if (!rl.ok) return publicTooMany();

    const userId = await resolveUser(request);
    if (!userId) {
      return publicJson({ data: null }, { status: 401, maxAge: 0 });
    }

    const membership = await getLatestMembership(userId);
    return publicJson(
      { data: membership },
      { maxAge: 0, headers: rateLimitHeaders(rl) },
    );
  } catch (e) {
    console.error("GET /api/club-join/me failed", e);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
