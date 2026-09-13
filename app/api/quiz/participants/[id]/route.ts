import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { participantProfile } from "@/lib/quiz-season";

/**
 * GET /api/quiz/participants/[id]
 * A player's season profile: rating, books covered, badges, per-quiz best
 * scores with placements, and any awards won.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const profile = await participantProfile(db, String(id || ""));
    return NextResponse.json({ profile });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to load player" }, { status: e.status || 500 });
  }
}