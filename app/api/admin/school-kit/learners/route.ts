import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/community-auth";
import { parseSeason, searchLearners } from "@/lib/school-kit";

/** GET /api/admin/school-kit/learners?q=&season= — search the Sprout roster. */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const season = parseSeason(searchParams.get("season"));
    const learners = await searchLearners(searchParams.get("q") ?? "", season);
    return NextResponse.json({ data: learners });
  } catch {
    return NextResponse.json({ error: "Failed to load learners" }, { status: 500 });
  }
}