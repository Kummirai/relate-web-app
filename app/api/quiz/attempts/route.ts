import { NextRequest, NextResponse } from "next/server";
import { startAttempt, submitAttempt } from "@/lib/quiz-season";

/**
 * POST /api/quiz/attempts
 *   { action: "start", participantId, clubSlug, ordinal, date? }
 *     → draws a fresh shuffled question set and returns it with the timer.
 *   { action: "submit", attemptId, answers, durationMs? }
 *     → scores the attempt, keeps the best per quiz week, returns badges + rating.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as any;
    if (body.action === "start") {
      const result = await startAttempt({
        participantId: String(body.participantId || ""),
        clubSlug: String(body.clubSlug || "").trim().toLowerCase(),
        ordinal: Number(body.ordinal),
        date: body.date ? String(body.date) : undefined,
      });
      return NextResponse.json({ attempt: result });
    }
    if (body.action === "submit") {
      const answers = Array.isArray(body.answers) ? body.answers : [];
      const result = await submitAttempt({
        attemptId: String(body.attemptId || ""),
        answers,
        durationMs: typeof body.durationMs === "number" ? body.durationMs : undefined,
      });
      return NextResponse.json({ result });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Quiz request failed" }, { status: e.status || 500 });
  }
}