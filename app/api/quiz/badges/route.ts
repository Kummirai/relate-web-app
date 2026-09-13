import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSeasonForClub, earnedBadges, BADGES } from "@/lib/quiz-season";

/**
 * GET /api/quiz/badges?participantId=...
 * Badge catalog, plus the caller's earned badges for their current season.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const participantId = params.get("participantId")?.trim() || null;
    let earned: any[] = [];
    if (participantId) {
      const db = await getDb();
      const participant = await db.collection("quiz_participants").findOne({ participantId });
      if (participant) {
        const season = await getSeasonForClub(db, participant.clubSlug);
        if (season) earned = await earnedBadges(db, participantId, season);
      }
    }
    return NextResponse.json({ badges: BADGES, earned });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to load badges" }, { status: e.status || 500 });
  }
}