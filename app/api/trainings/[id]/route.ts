import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import {
  formatBoardDate,
  listBoardMembers,
  notifyBoardMembers,
  parseDate,
  pickText,
} from "@/lib/board-governance";
import {
  sanitizeTrainingDays,
  serializeTraining,
  trainingDayLines,
} from "@/lib/trainings";

async function findTraining(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  return db.collection("trainings").findOne({ _id: new ObjectId(id) });
}

/**
 * Admin: read a single training.
 *
 * GET /api/trainings/[id]
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
    const training = await findTraining(id);
    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: serializeTraining(training),
      currentUserId: admin.id,
      canManage:
        !training.createdBy || String(training.createdBy) === admin.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load the training" },
      { status: 500 },
    );
  }
}

/**
 * Admin: update a training. Every admin is told about the change.
 *
 * PATCH /api/trainings/[id]
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
    const training = await findTraining(id);
    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }
    if (training.createdBy && String(training.createdBy) !== admin.id) {
      return NextResponse.json(
        { error: "Only the admin who scheduled this training can change it" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};

    if (typeof body?.title === "string") {
      const title = pickText(body.title, 160);
      if (!title) {
        return NextResponse.json({ error: "Give the training a title" }, { status: 400 });
      }
      updates.title = title;
    }
    if (body?.description !== undefined) {
      updates.description = pickText(body.description, 4000);
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
    if (body?.location !== undefined) {
      updates.location = pickText(body.location, 160);
    }
    if (body?.imageUrl !== undefined) {
      updates.imageUrl = pickText(body.imageUrl, 600);
    }
    if (body?.days !== undefined) {
      updates.days = sanitizeTrainingDays(body.days);
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }
    updates.updatedAt = new Date();

    const db = await getDb();
    await db
      .collection("trainings")
      .updateOne({ _id: training._id }, { $set: updates });

    const updated = await db
      .collection("trainings")
      .findOne({ _id: training._id });

    const title = String(updates.title || training.title);
    const when = formatBoardDate(updated?.scheduledDate);
    const members = await listBoardMembers(db);
    await notifyBoardMembers(
      db,
      members,
      {
        type: "training_updated",
        title: "Training updated",
        body: `${title} — ${when}.`,
        data: { trainingId: id },
        email: {
          subject: `Training updated: ${title}`,
          paragraphs: [
            "A training on the officer calendar has been updated.",
            `When: ${when}`,
            ...(updated?.days?.length > 1
              ? [`Runs over ${updated.days.length} days.`]
              : []),
            ...trainingDayLines(sanitizeTrainingDays(updated?.days)),
            ...(updated?.location ? [`Where: ${updated.location}`] : []),
            "Open the app to see the latest details.",
          ],
        },
      },
      admin.id,
    );

    return NextResponse.json({ data: serializeTraining(updated) });
  } catch {
    return NextResponse.json(
      { error: "Failed to update the training" },
      { status: 500 },
    );
  }
}

/**
 * Admin: remove a training scheduled in error. Every admin is told.
 *
 * DELETE /api/trainings/[id]
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
    const training = await findTraining(id);
    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }
    if (training.createdBy && String(training.createdBy) !== admin.id) {
      return NextResponse.json(
        { error: "Only the admin who scheduled this training can delete it" },
        { status: 403 },
      );
    }

    const db = await getDb();
    await db.collection("trainings").deleteOne({ _id: training._id });

    const title = training.title || "Training";
    const when = formatBoardDate(training.scheduledDate);
    try {
      const members = await listBoardMembers(db);
      await notifyBoardMembers(
        db,
        members,
        {
          type: "training_deleted",
          title: "Training cancelled",
          body: `${title} — ${when} was removed from the calendar.`,
          data: { trainingId: id },
          email: {
            subject: `Training removed: ${title}`,
            paragraphs: [
              `${title} has been removed from the training calendar.`,
              `It was due: ${when}`,
              "No further action is needed.",
            ],
          },
        },
        admin.id,
      );
    } catch {
      // The training is already gone; a notification failure must not report
      // the delete as failed.
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete the training" },
      { status: 500 },
    );
  }
}
