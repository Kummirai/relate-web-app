import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import { backfillQuizParticipants } from "@/lib/quiz-season";

/**
 * POST /api/quiz/backfill-participants
 * Admin-only, idempotent. Scans Sprout club registrations for Bible Quiz
 * sign-ups and creates the missing quiz players (linked to the registering
 * account) so pre-bridge joiners are recognized. Safe to run repeatedly.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const db = await getDb();
    const result = await backfillQuizParticipants(db);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Backfill failed" }, { status: 500 });
  }
}
