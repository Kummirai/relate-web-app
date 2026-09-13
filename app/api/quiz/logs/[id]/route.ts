import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSeasonForClub, leaderboardForWeek, weekState } from "@/lib/quiz-season";

/**
 * GET /api/quiz/logs/[id]
 * Full leaderboard for one quiz week. id shape: `{clubSlug}__{ordinal}`.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [clubSlug, ordinalRaw] = String(id || "").split("__");
    const ordinal = Number(ordinalRaw);
    if (!clubSlug || !Number.isFinite(ordinal)) {
      return NextResponse.json({ error: "Invalid quiz log id" }, { status: 400 });
    }

    const db = await getDb();
    const season = await getSeasonForClub(db, clubSlug);
    if (!season) {
      return NextResponse.json({ error: "No quiz season for this club" }, { status: 404 });
    }
    const week = season.quizWeeks.find((w: any) => w.ordinal === ordinal);
    if (!week) {
      return NextResponse.json({ error: "Quiz week not found" }, { status: 404 });
    }

    const participants = await leaderboardForWeek(db, season, week);
    return NextResponse.json({
      id,
      clubSlug,
      seasonLabel: season.label,
      quizName: week.name,
      book: week.book,
      kind: week.kind,
      openFrom: week.openFrom,
      openUntil: week.openUntil,
      state: weekState(week),
      participants,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to load quiz log" }, { status: e.status || 500 });
  }
}