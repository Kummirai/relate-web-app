import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin, resolveSession } from "@/lib/community-auth";
import {
  isTaskStatus,
  notifyBoardMember,
  serializeMinutes,
} from "@/lib/board-governance";

/**
 * Assignee (or an admin) moves an action item through
 * PENDING -> IN_PROGRESS -> DONE.
 *
 * PATCH /api/board/minutes/[id]/tasks/[taskId]  { status }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const session = await resolveSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, taskId } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid minutes" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    if (!isTaskStatus(body?.status)) {
      return NextResponse.json({ error: "Unknown task status" }, { status: 400 });
    }

    const db = await getDb();
    const minutes = db.collection("board_minutes");
    const doc = await minutes.findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json({ error: "Minutes not found" }, { status: 404 });
    }

    const items = Array.isArray(doc.actionItems) ? doc.actionItems : [];
    const task = items.find((item: any) => item.taskId === taskId);
    if (!task) {
      return NextResponse.json({ error: "Action item not found" }, { status: 404 });
    }

    const admin = await requireAdmin(request);
    if (!admin && task.assigneeId !== session.id) {
      return NextResponse.json(
        { error: "Only the assignee can update this action item" },
        { status: 403 },
      );
    }

    const now = new Date();
    await minutes.updateOne(
      { _id: doc._id },
      {
        $set: {
          "actionItems.$[item].status": body.status,
          "actionItems.$[item].updatedAt": now,
          updatedAt: now,
        },
      },
      { arrayFilters: [{ "item.taskId": taskId }] },
    );

    const updated = await minutes.findOne({ _id: doc._id });
    const updatedTask = (Array.isArray(updated?.actionItems) ? updated.actionItems : []).find(
      (item: any) => item.taskId === taskId,
    );

    // Keep the secretary in the loop when an assignee finishes their item.
    if (!admin && body.status === "DONE" && doc.publishedBy) {
      await notifyBoardMember(
        db,
        {
          id: doc.publishedBy,
          name: doc.publishedByName || "Board Secretary",
          email: "",
          role: "admin",
        },
        {
          type: "board_action_completed",
          title: "Board action completed",
          body: `${task.assigneeName || "A board member"} completed: ${task.taskDescription}`,
          data: { minutesId: id, meetingId: doc.meetingId, taskId },
        },
      );
    }

    return NextResponse.json({
      data: {
        task: updatedTask
          ? {
              taskId: updatedTask.taskId,
              assigneeId: updatedTask.assigneeId,
              assigneeName: updatedTask.assigneeName,
              taskDescription: updatedTask.taskDescription,
              dueDate: updatedTask.dueDate || null,
              status: updatedTask.status,
            }
          : null,
        counts: serializeMinutes(updated).counts,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update the action item" },
      { status: 500 },
    );
  }
}
