import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  getSeasonForClub,
  seasonState,
  weekState,
  todayKey,
  buildLogForWeek,
} from "@/lib/quiz-season";

/**
 * GET /api/quiz/overview?clubSlug=sprout-kids
 * Season status, books, weekly unlock schedule and the top-5 of the latest
 * open quiz week for the club leaderboard on the hub.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const clubSlug = String(params.get("clubSlug") || "").trim().toLowerCase();
    if (!clubSlug) {
      return NextResponse.json({ error: "clubSlug is required" }, { status: 400 });
    }

    const db = await getDb();
    const season = await getSeasonForClub(db, clubSlug);
    if (!season) {
      return NextResponse.json({ season: null, state: "none", now: todayKey(), top: [] });
    }

    const weeks = season.quizWeeks.map((w: any) => ({
      ordinal: w.ordinal,
      name: w.name,
      book: w.book,
      kind: w.kind,
      openFrom: w.openFrom,
      openUntil: w.openUntil,
      state: weekState(w),
    }));

    const liveWeek = season.quizWeeks
      .filter((w: any) => weekState(w) === "open")
      .sort((a: any, b: any) => b.ordinal - a.ordinal)[0];
    const top = liveWeek ? await buildLogForWeek(db, season, liveWeek) : [];

    return NextResponse.json({
      season: {
        key: season.key,
        label: season.label,
        clubSlug: season.clubSlug,
        readStart: season.readStart,
        readEnd: season.readEnd,
        quizStart: season.quizStart,
        endDate: season.endDate,
        state: seasonState(season),
        books: season.books ?? [],
        awards: season.awards ?? [],
        perQuestionSeconds: season.perQuestionSeconds ?? {},
        weeks,
      },
      state: seasonState(season),
      now: todayKey(),
      top,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to load quiz" }, { status: e.status || 500 });
  }
}