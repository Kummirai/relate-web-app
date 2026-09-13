import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSeasonForClub, weekState, buildLogForWeek } from "@/lib/quiz-season";

const SPROUT_CLUBS = ["sprout-kids", "sprout-tweens", "sprout-teens"];

/**
 * GET /api/quiz/logs
 * The seasonal quiz rail: for each Sprout club, the top-5 board of its latest
 * opened quiz week, newest first, up to 3 entries (matches the home rail).
 */
export async function GET(_request: NextRequest) {
  try {
    const db = await getDb();
    const logs: any[] = [];
    for (const clubSlug of SPROUT_CLUBS) {
      const season = await getSeasonForClub(db, clubSlug);
      if (!season) continue;
      const liveWeek = season.quizWeeks
        .filter((w: any) => weekState(w) !== "upcoming")
        .sort((a: any, b: any) => b.ordinal - a.ordinal)[0];
      if (!liveWeek) continue;
      logs.push(await buildLogForWeek(db, season, liveWeek));
    }
    logs.sort((a, b) => (a.openFrom < b.openFrom ? -1 : 1));
    return NextResponse.json({ logs: logs.slice(0, 3) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to load quiz logs" }, { status: e.status || 500 });
  }
}