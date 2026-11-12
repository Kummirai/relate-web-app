import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import {
  formatBoardDate,
  listBoardMembers,
  notifyBoardMembers,
  parseDate,
  parseMeetingLink,
  pickText,
} from "@/lib/board-governance";
import {
  sanitizeTrainingDays,
  serializeTraining,
  trainingDayLines,
} from "@/lib/trainings";

/**
 * Officer and position trainings. Admins (the board) schedule them; only
 * admins can list them and only admins are notified.
 *
 * GET  /api/trainings
 * POST /api/trainings
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const docs = await db
      .collection("trainings")
      .find({})
      .sort({ scheduledDate: 1 })
      .limit(200)
      .toArray();

    return NextResponse.json({ data: docs.map(serializeTraining) });
  } catch {
    return NextResponse.json(
      { error: "Failed to load trainings" },
      { status: 500 },
    );
  }
}

/** Admin: schedule a training for the board. */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = pickText(body?.title, 160);
    const description = pickText(body?.description, 4000);
    const scheduledDate = parseDate(body?.scheduledDate);
    if (!title) {
      return NextResponse.json({ error: "Give the training a title" }, { status: 400 });
    }
    if (!scheduledDate) {
      return NextResponse.json(
        { error: "Choose a valid date and time" },
        { status: 400 },
      );
    }
    const meetingLink = parseMeetingLink(body?.meetingLink);
    if (meetingLink === null) {
      return NextResponse.json(
        { error: "Enter a full meeting link starting with https://" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const location = pickText(body?.location, 160);
    const imageUrl = pickText(body?.imageUrl, 600);
    const days = sanitizeTrainingDays(body?.days);
    const now = new Date();
    const doc = {
      title,
      description,
      scheduledDate,
      location,
      meetingLink,
      imageUrl,
      days,
      attendance: [] as unknown[],
      createdBy: admin.id,
      createdByName: admin.name || "Board Secretary",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("trainings").insertOne(doc);

    const when = formatBoardDate(scheduledDate);
    const members = await listBoardMembers(db);
    await notifyBoardMembers(
      db,
      members,
      {
        type: "training_created",
        title: "New training scheduled",
        body: `${title} — ${when}.`,
        data: { trainingId: result.insertedId.toString() },
        email: {
          subject: `Training scheduled: ${title}`,
          paragraphs: [
            "A training has been scheduled for officers and positions.",
            `When: ${when}`,
            ...(days.length > 1 ? [`Runs over ${days.length} days.`] : []),
            ...trainingDayLines(days),
            ...(location ? [`Where: ${location}`] : []),
            ...(meetingLink ? [`Join online: ${meetingLink}`] : []),
            ...(description ? [description] : []),
            "Open the app to see the full details and mark your attendance.",
          ],
        },
      },
      admin.id,
    );

    return NextResponse.json(
      { data: serializeTraining({ ...doc, _id: result.insertedId }) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to schedule the training" },
      { status: 500 },
    );
  }
}
