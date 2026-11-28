import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/community-auth";
import { parseSeason, setExamCheck } from "@/lib/school-kit";

/** POST /api/admin/school-kit/learners/[id]/exam-check { checked, season } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const checked = body?.checked === true;
    const season = parseSeason(body?.season);

    const ok = await setExamCheck({
      memberId: id,
      checked,
      season,
      adminId: admin.id,
      adminName: admin.name ?? "Admin",
    });
    if (!ok) return NextResponse.json({ error: "Learner not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: { checked, season } });
  } catch {
    return NextResponse.json({ error: "Failed to save the stationery check" }, { status: 500 });
  }
}