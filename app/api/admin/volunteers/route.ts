import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import { ensureVolunteerIndexes, serializeVolunteer } from "@/lib/volunteers";

/**
 * Admin volunteer-request queue.
 *
 *  GET /api/admin/volunteers?status=new
 *     Lists applications, newest first, optionally filtered by status.
 *     ?assigned=me limits to the acting admin. ?countOnly=1 powers the
 *     dashboard sidebar badge. Admin only.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const assigned = searchParams.get("assigned");
    const filter: Record<string, unknown> = {};
    if (status && status !== "all") {
      filter.status = status;
    }
    if (assigned === "me") {
      filter.assignedTo = admin.id;
    }

    const db = await getDb();
    await ensureVolunteerIndexes(db);
    const col = db.collection("volunteer_requests");

    if (searchParams.get("countOnly") === "1") {
      const count = await col.countDocuments(filter);
      return NextResponse.json({ count });
    }

    const rawLimit = Number(searchParams.get("limit")) || 200;
    const limit = Math.min(Math.max(rawLimit, 1), 500);

    const docs = await col
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      data: docs.map(serializeVolunteer),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load volunteer requests" },
      { status: 500 },
    );
  }
}
