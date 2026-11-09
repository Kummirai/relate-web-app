import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { findUserById, requireAdmin } from "@/lib/community-auth";
import {
  isRsvpStatus,
  serializeMeeting,
} from "@/lib/board-governance";

/**
 * Board member: record attendance for the signed-in admin.
 *
 * PATCH /api/board/meetings/[id]/rsvp  { status: "ATTENDING" | "APOLOGY" }
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
      return NextResponse.json({ error: "Invalid meeting" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const status = body?.status;
    if (status !== "ATTENDING" && status !== "APOLOGY") {
      return NextResponse.json(
        { error: "Choose attending or apologies" },
        { status: 400 },
      );
    }
    if (!isRsvpStatus(status)) {
      return NextResponse.json({ error: "Unknown RSVP status" }, { status: 400 });
    }

    const db = await getDb();
    const meetings = db.collection("board_meetings");
    const meeting = await meetings.findOne({ _id: new ObjectId(id) });
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const rsvps = Array.isArray(meeting.rsvps) ? meeting.rsvps : [];
    const alreadyListed = rsvps.some((r: any) => r.userId === admin.id);

    if (alreadyListed) {
      await meetings.updateOne(
        { _id: meeting._id },
        {
          $set: {
            "rsvps.$[member].status": status,
            updatedAt: new Date(),
          },
        },
        { arrayFilters: [{ "member.userId": admin.id }] },
      );
    } else {
      const user = await findUserById(db, admin.id);
      await meetings.updateOne(
        { _id: meeting._id },
        {
          $push: {
            rsvps: {
              userId: admin.id,
              name: user?.name || admin.name || "Board member",
              role: user?.role || "admin",
              status,
            },
          },
          $set: { updatedAt: new Date() },
        } as any,
      );
    }

    const updated = await meetings.findOne({ _id: meeting._id });
    return NextResponse.json({ data: serializeMeeting(updated) });
  } catch {
    return NextResponse.json(
      { error: "Failed to save your RSVP" },
      { status: 500 },
    );
  }
}
