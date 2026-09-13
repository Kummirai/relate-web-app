import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/community-auth";
import { seedQuizSeason } from "@/lib/quiz-season";

/**
 * POST /api/quiz/seed-season
 * Admin-only dev tool. Resets and writes Summer 2026/27 seasons for the three
 * Sprout clubs plus the full Genesis question bank (Beginnings, Abraham,
 * Isaac & Jacob, Joseph).
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const counts = await seedQuizSeason();
    return NextResponse.json({ ok: true, ...counts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Seed failed" }, { status: 500 });
  }
}