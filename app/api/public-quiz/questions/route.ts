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
import { HUB_CLUBS, cleanName, drawHubQuestions, normalizeClub } from "@/lib/public-quiz";

/**
 * GET /api/public-quiz/questions?club=sprout&count=10
 * A fresh shuffled question draw for the hub quiz. Answers are never sent to
 * the client — they stay server-side and scoring happens on submit.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`public-quiz-questions:${clientIp(request)}`, 60);
    if (!rl.ok) {
      return publicTooMany();
    }

    const params = request.nextUrl.searchParams;
    const club = normalizeClub(params.get("club"));
    if (!club) {
      return publicBadRequest(`club must be one of: ${HUB_CLUBS.join(", ")}`);
    }

    const rawCount = Number(params.get("count") ?? 10);
    const count = Number.isFinite(rawCount) ? Math.min(15, Math.max(5, Math.trunc(rawCount))) : 10;

    const questions = drawHubQuestions(count);

    return publicJson(
      {
        club,
        count: questions.length,
        questions: questions.map(({ id, book, bookLabel, text, options }) => ({
          id,
          book,
          bookLabel,
          text,
          options,
        })),
      },
      { maxAge: 0, headers: rateLimitHeaders(rl) },
    );
  } catch (error) {
    console.error("GET /api/public-quiz/questions failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };