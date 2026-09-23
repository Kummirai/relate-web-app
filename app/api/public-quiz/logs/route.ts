import { NextRequest } from "next/server";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";
import {
  publicBadRequest,
  publicError,
  publicJson,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { HUB_CLUBS, hubBoardForClub, normalizeClub } from "@/lib/public-quiz";

/**
 * GET /api/public-quiz/logs?club=sprout
 * The current round's top-5 board and recent attempts for one club.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`public-quiz-logs:${clientIp(request)}`, 120);
    if (!rl.ok) {
      return publicTooMany();
    }

    const club = normalizeClub(request.nextUrl.searchParams.get("club"));
    if (!club) {
      return publicBadRequest(`club must be one of: ${HUB_CLUBS.join(", ")}`);
    }

    const board = await hubBoardForClub(club);

    return publicJson(
      { club, board },
      { maxAge: 0, headers: rateLimitHeaders(rl) },
    );
  } catch (error) {
    console.error("GET /api/public-quiz/logs failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };