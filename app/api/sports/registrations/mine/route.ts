import { NextRequest } from "next/server";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";
import {
  publicError,
  publicJson,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { resolveUser } from "@/lib/community-auth";
import { getMyRegistration } from "@/lib/sports-registrations";

/**
 * GET /api/sports/registrations/mine
 *   → { data: <my registration> | null } for the signed-in account.
 *
 * One team per member, so this is the single row the member owns — the team
 * details card ("you're already on a team") and the join-a-team gate read it.
 * 401 (with data: null) for guests, mirroring GET /api/club-join/me.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`sports-reg-mine:${clientIp(request)}`, 30, 60_000);
    if (!rl.ok) return publicTooMany();

    const userId = await resolveUser(request);
    if (!userId) {
      return publicJson({ data: null }, { status: 401, maxAge: 0 });
    }

    const registration = await getMyRegistration(userId);
    return publicJson(
      { data: registration },
      { maxAge: 0, headers: rateLimitHeaders(rl) },
    );
  } catch (e) {
    console.error("[sports/registrations/mine] GET failed", e);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
