import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import {
  agendaEmailLines,
  formatBoardDate,
  isMeetingStatus,
  listBoardMembers,
  notifyBoardMembers,
  parseDate,
  pickText,
  sanitizeAgenda,
  serializeMeeting,
} from "@/lib/board-governance";

/**
 * Admin (board member): one meeting as a read-only record — the schedule
 * screen is for creating and editing, so viewing a sitting never starts
 * from the scheduler form.
 *
 * GET /api/board/meetings/[id]
 */
export async function GET(
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

    const db = await getDb();
    const meeting = await db
      .collection("board_meetings")
      .findOne({ _id: new ObjectId(id) });
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: serializeMeeting(meeting),
      currentUserId: admin.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load the meeting" },
      { status: 500 },
    );
  }
}

/**
 * Admin (secretary): update a meeting. Every board member is told about the
 * change by in-app, push and email.
 *
 * PATCH /api/board/meetings/[id]
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

    const db = await getDb();
    const meeting = await db
      .collection("board_meetings")
      .findOne({ _id: new ObjectId(id) });
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};

    if (typeof body?.title === "string") {
      const title = pickText(body.title, 160);
      if (!title) {
        return NextResponse.json({ error: "Give the meeting a title" }, { status: 400 });
      }
      updates.title = title;
    }
    if (body?.scheduledDate !== undefined) {
      const scheduledDate = parseDate(body.scheduledDate);
      if (!scheduledDate) {
        return NextResponse.json(
          { error: "Choose a valid date and time" },
          { status: 400 },
        );
      }
      updates.scheduledDate = scheduledDate;
    }
    if (typeof body?.location === "string") {
      updates.location = pickText(body.location, 160) || "Relate World HQ";
    }
    if (body?.agenda !== undefined) updates.agenda = sanitizeAgenda(body.agenda);
    if (body?.status !== undefined) {
      if (!isMeetingStatus(body.status)) {
        return NextResponse.json({ error: "Unknown meeting status" }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }
    updates.updatedAt = new Date();

    await db
      .collection("board_meetings")
      .updateOne({ _id: meeting._id }, { $set: updates });

    const updated = await db
      .collection("board_meetings")
      .findOne({ _id: meeting._id });

    const title = String(updates.title || meeting.title);
    const when = formatBoardDate(updated?.scheduledDate);
    const agenda = sanitizeAgenda(updated?.agenda);
    const members = await listBoardMembers(db);
    await notifyBoardMembers(
      db,
      members,
      {
        type: "board_meeting_updated",
        title: "Board meeting updated",
        body: `${title} — ${when}.`,
        data: { meetingId: id },
        email: {
          subject: `Board meeting updated: ${title}`,
          paragraphs: [
            "A board meeting has been updated.",
            `When: ${when}`,
            `Where: ${updated?.location || meeting.location || "Relate World HQ"}`,
            ...(agenda.length
              ? ["Agenda:", ...agendaEmailLines(agenda)]
              : []),
            "Open the board governance portal to confirm your attendance or send apologies.",
          ],
        },
      },
      admin.id,
    );

    return NextResponse.json({ data: serializeMeeting(updated) });
  } catch {
    return NextResponse.json(
      { error: "Failed to update the meeting" },
      { status: 500 },
    );
  }
}

/**
 * Admin (secretary): remove a meeting scheduled in error. Meetings that
 * already have minutes must have those withdrawn first, so no published
 * record is orphaned.
 *
 * DELETE /api/board/meetings/[id]
 */
export async function DELETE(
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

    const db = await getDb();
    const meeting = await db
      .collection("board_meetings")
      .findOne({ _id: new ObjectId(id) });
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const minutes = await db.collection("board_minutes").findOne({ meetingId: id });
    if (minutes) {
      return NextResponse.json(
        {
          error:
            "This meeting already has minutes — delete the minutes first, then the meeting.",
        },
        { status: 409 },
      );
    }

    await db.collection("board_meetings").deleteOne({ _id: meeting._id });

    const title = meeting.title || "Board meeting";
    const when = formatBoardDate(meeting.scheduledDate);
    const members = await listBoardMembers(db);
    await notifyBoardMembers(
      db,
      members,
      {
        type: "board_meeting_deleted",
        title: "Board meeting cancelled",
        body: `${title} — ${when} was removed from the schedule.`,
        email: {
          subject: `Board meeting removed: ${title}`,
          paragraphs: [
            `${title} has been removed from the board schedule.`,
            `It was due: ${when}`,
            "No further attendance is needed.",
          ],
        },
      },
      admin.id,
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete the meeting" },
      { status: 500 },
    );
  }
}
