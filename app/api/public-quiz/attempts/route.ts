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
import { cleanName, startHubAttempt, submitHubAttempt } from "@/lib/public-quiz";

function errorStatus(e: any): number {
  return typeof e?.status === "number" ? e.status : 500;
}

/**
 * POST /api/public-quiz/attempts
 *   { action: "start", club, name, count? }
 *     → persists a shuffled draw and returns the questions (no answers).
 *   { action: "submit", attemptId, answers: [{questionId, selected}], durationMs? }
 *     → scores server-side and returns the attempt result.
 */
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(`public-quiz-attempts:${clientIp(request)}`, 40);
    if (!rl.ok) {
      return publicTooMany();
    }

    const body = (await request.json().catch(() => ({}))) as any;

    if (body.action === "start") {
      const started = await startHubAttempt({
        club: body.club,
        name: body.name,
        count: body.count,
      });
      return publicJson({ attempt: started }, { maxAge: 0, headers: rateLimitHeaders(rl) });
    }

    if (body.action === "submit") {
      const answers = Array.isArray(body.answers)
        ? body.answers.map((a: any) => ({
            questionId: String(a?.questionId ?? ""),
            selected: Number(a?.selected),
          }))
        : [];
      const result = await submitHubAttempt({
        attemptId: body.attemptId,
        answers,
        durationMs: body.durationMs,
      });
      return publicJson({ result }, { maxAge: 0, headers: rateLimitHeaders(rl) });
    }

    return publicBadRequest("action must be 'start' or 'submit'.");
  } catch (e: any) {
    console.error("POST /api/public-quiz/attempts failed", e);
    const status = errorStatus(e);
    if (status < 500) {
      return publicJson(
        { error: e?.message || "Bad request" },
        { status, maxAge: 0 },
      );
    }
    return publicError();
  }
}

export { publicOptions as OPTIONS };