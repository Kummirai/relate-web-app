import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/community-auth";
import { learnerDetail, parseSeason } from "@/lib/school-kit";

/** GET /api/admin/school-kit/learners/[id] — one learner's kit and history. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const season = parseSeason(new URL(request.url).searchParams.get("season"));
    const result = await learnerDetail(id, season);
    if (!result) return NextResponse.json({ error: "Learner not found" }, { status: 404 });
    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: "Failed to load learner" }, { status: 500 });
  }
}