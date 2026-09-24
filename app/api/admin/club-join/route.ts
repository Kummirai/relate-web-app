import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";

const STATUSES = ["pending_interview", "accepted", "rejected"] as const;
const VALID_STATUS_FILTERS = [...STATUSES, "all"] as const;

function formatDoc(doc: any) {
  return { ...doc, _id: doc._id.toString() };
}

/**
 * Admin club-join review — view registrations and decide accept/reject.
 *
 *  GET /api/admin/club-join?status=pending_interview
 *     Lists applications (newest first), optionally filtered by status.
 *     Admin only.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = request.nextUrl.searchParams.get("status") ?? "all";
    if (!(VALID_STATUS_FILTERS as readonly string[]).includes(status)) {
      return NextResponse.json(
        { error: 'status must be "all", "pending_interview", "accepted" or "rejected"' },
        { status: 400 },
      );
    }

    const db = await getDb();
    const documents = await db
      .collection("club_join_applications")
      .find(status === "all" ? {} : { status })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({ data: documents.map(formatDoc) });
  } catch {
    return NextResponse.json(
      { error: "Failed to load club-join applications" },
      { status: 500 },
    );
  }
}