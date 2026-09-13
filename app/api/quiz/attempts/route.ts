import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { startAttempt, submitAttempt, isSproutMember } from "@/lib/quiz-season";

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
      // Only Sprout club members can play. The player must also belong to the
      // signed-in member's account so one child can't play as another.
      const user = await resolveSession(request);
      if (!user) {
        return NextResponse.json(
          { error: "Sign in to play the quiz — only Sprout club members can play." },
          { status: 401 },
        );
      }
      const db = await getDb();
      if (!(await isSproutMember(db, user.id))) {
        return NextResponse.json(
          { error: "Only Sprout club members can play the Bible Quiz." },
          { status: 403 },
        );
      }
      const participant = await db.collection("quiz_participants").findOne({
        participantId: String(body.participantId || ""),
      });
      if (participant && participant.userId && participant.userId !== user.id) {
        return NextResponse.json(
          { error: "This player belongs to a different account." },
          { status: 403 },
        );
      }
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