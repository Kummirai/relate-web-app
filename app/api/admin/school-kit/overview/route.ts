import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/community-auth";
import { buildOverview, parseSeason } from "@/lib/school-kit";

/** GET /api/admin/school-kit/overview?season=2026 — dashboard figures. */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const season = parseSeason(new URL(request.url).searchParams.get("season"));
    return NextResponse.json({ data: await buildOverview(season) });
  } catch {
    return NextResponse.json({ error: "Failed to load the School Kit overview" }, { status: 500 });
  }
}