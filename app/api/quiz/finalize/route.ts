import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import { closeSeasons } from "@/lib/quiz-season";

/**
 * POST /api/quiz/finalize
 * Admin-only. Closes any Sprout season whose end date has passed and writes
 * the top-3 awards + perfect-scorer stickers. Safe to call repeatedly.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const db = await getDb();
    const finalized = await closeSeasons(db);
    if (finalized.length === 0) {
      return NextResponse.json({ ok: true, finalized: [] });
    }
    return NextResponse.json({ ok: true, finalized });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Finalize failed" }, { status: 500 });
  }
}