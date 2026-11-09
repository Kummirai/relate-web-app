import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import {
  applyAttendance,
  composeMinutesSummary,
  listBoardMembers,
  mergeActionItems,
  pickText,
  sanitizeMinutesSections,
  serializeMinutes,
} from "@/lib/board-governance";

/**
 * Admin (secretary): correct published minutes. Sections, the signed document
 * and action items can all change; existing tasks keep their id and progress,
 * and the original 48-hour compliance figures are left untouched.
 *
 * PATCH /api/board/minutes/[id]
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
      return NextResponse.json({ error: "Invalid minutes" }, { status: 400 });
    }

    const db = await getDb();
    const minutes = await db
      .collection("board_minutes")
      .findOne({ _id: new ObjectId(id) });
    if (!minutes) {
      return NextResponse.json({ error: "Minutes not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};

    if (body?.sections !== undefined) {
      const sections = sanitizeMinutesSections(body.sections);
      const summary = composeMinutesSummary(sections);
      if (!summary) {
        return NextResponse.json(
          { error: "Add at least one decision or note" },
          { status: 400 },
        );
      }
      updates.sections = sections;
      updates.summary = summary;
    } else if (typeof body?.summary === "string") {
      const summary = pickText(body.summary, 20000);
      if (!summary) {
        return NextResponse.json(
          { error: "Write the meeting summary and key decisions" },
          { status: 400 },
        );
      }
      updates.summary = summary;
    }

    if (body?.minutesDocumentUrl !== undefined) {
      const documentUrl = pickText(body.minutesDocumentUrl, 600);
      if (!/^https?:\/\//i.test(documentUrl)) {
        return NextResponse.json(
          { error: "Upload the signed minutes or paste a valid document link" },
          { status: 400 },
        );
      }
      updates.minutesDocumentUrl = documentUrl;
    }

    const members = await listBoardMembers(db);
    if (body?.actionItems !== undefined) {
      const existing = Array.isArray(minutes.actionItems) ? minutes.actionItems : [];
      updates.actionItems = mergeActionItems(body.actionItems, members, existing);
    }

    if (body?.attendance !== undefined && ObjectId.isValid(minutes.meetingId)) {
      const meeting = await db
        .collection("board_meetings")
        .findOne({ _id: new ObjectId(minutes.meetingId) });
      if (meeting) {
        const rsvps = applyAttendance(
          Array.isArray(meeting.rsvps) ? meeting.rsvps : [],
          body.attendance,
        );
        await db
          .collection("board_meetings")
          .updateOne(
            { _id: meeting._id },
            { $set: { rsvps, updatedAt: new Date() } },
          );
      }
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const now = new Date();
    updates.updatedAt = now;
    updates.editedAt = now;
    updates.editedByName = admin.name || "Board Secretary";

    await db
      .collection("board_minutes")
      .updateOne({ _id: minutes._id }, { $set: updates });
    const updated = await db
      .collection("board_minutes")
      .findOne({ _id: minutes._id });

    return NextResponse.json({ data: serializeMinutes(updated) });
  } catch {
    return NextResponse.json(
      { error: "Failed to update the minutes" },
      { status: 500 },
    );
  }
}
