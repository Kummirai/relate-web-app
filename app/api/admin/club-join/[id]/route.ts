import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";

const ACTIONS = ["accept", "reject"] as const;

/**
 * Admin decision on a club-join application.
 *
 *  PATCH /api/admin/club-join/{id}  { action: "accept" | "reject", note? }
 *     accept: pending_interview -> accepted
 *     reject: pending_interview -> rejected
 *     Only applications still awaiting the chaplain interview can be decided.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action;
    if (!(ACTIONS as readonly string[]).includes(action)) {
      return NextResponse.json(
        { error: 'action must be "accept" or "reject"' },
        { status: 400 },
      );
    }

    const note =
      typeof body.note === "string" ? body.note.trim().slice(0, 300) : "";

    const db = await getDb();
    const application = await db
      .collection("club_join_applications")
      .findOne({ _id: new ObjectId(id) });
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.status !== "pending_interview") {
      return NextResponse.json(
        { error: "This application has already been decided" },
        { status: 409 },
      );
    }

    const newStatus = action === "accept" ? "accepted" : "rejected";
    await db.collection("club_join_applications").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: newStatus,
          note: note || undefined,
          reviewedAt: new Date(),
          reviewedBy: admin.id,
          updatedAt: new Date(),
        },
      },
    );

    const updated = await db
      .collection("club_join_applications")
      .findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      data: { ...updated, _id: updated._id.toString() },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 },
    );
  }
}