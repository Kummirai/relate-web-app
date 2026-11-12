import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import {
  agendaEmailLines,
  formatBoardDate,
  isMeetingStatus,
  listBoardMembers,
  notifyBoardMembers,
  parseDate,
  parseMeetingLink,
  pickText,
  sanitizeAgenda,
  serializeMeeting,
  serializeMeetingCard,
} from "@/lib/board-governance";

/**
 * Board meetings — the secretary schedules them here and every board member
 * (admin user) is notified by in-app, push and email.
 *
 * GET  /api/board/meetings?scope=upcoming|past|all
 * POST /api/board/meetings
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "upcoming";
    const status = searchParams.get("status");
    const now = new Date();

    const filter: any = {};
    if (scope === "upcoming") {
      filter.scheduledDate = { $gte: now };
      filter.status = "SCHEDULED";
    } else if (scope === "past") {
      filter.$or = [
        { scheduledDate: { $lt: now } },
        { status: { $in: ["COMPLETED", "CANCELLED"] } },
      ];
    }
    if (status && isMeetingStatus(status)) filter.status = status;

    // List screens only need the card fields — agenda and RSVPs load on open.
    const cardsOnly = searchParams.get("view") === "cards";
    const docs = await db
      .collection("board_meetings")
      .find(
        filter,
        cardsOnly
          ? {
              projection: {
                title: 1,
                scheduledDate: 1,
                location: 1,
                meetingLink: 1,
                status: 1,
              },
            }
          : {},
      )
      .sort({ scheduledDate: scope === "upcoming" ? 1 : -1 })
      .limit(200)
      .toArray();

    if (cardsOnly) {
      return NextResponse.json({
        data: docs.map(serializeMeetingCard),
        currentUserId: admin.id,
      });
    }

    return NextResponse.json({
      data: docs.map(serializeMeeting),
      boardMembers: await listBoardMembers(db),
      currentUserId: admin.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load board meetings" },
      { status: 500 },
    );
  }
}

/** Admin (secretary): schedule a meeting for the whole board. */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = pickText(body?.title, 160);
    const scheduledDate = parseDate(body?.scheduledDate);
    if (!title) {
      return NextResponse.json({ error: "Give the meeting a title" }, { status: 400 });
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
    const members = await listBoardMembers(db);
    if (!members.length) {
      return NextResponse.json({ error: "No board members found" }, { status: 409 });
    }

    const location = pickText(body?.location, 160) || "Relate World HQ";
    const agenda = sanitizeAgenda(body?.agenda);
    const now = new Date();
    const doc = {
      title,
      scheduledDate,
      location,
      meetingLink,
      agenda,
      rsvps: members.map((m) => ({
        userId: m.id,
        name: m.name,
        role: m.role,
        status: m.id === admin.id ? "ATTENDING" : "PENDING",
      })),
      status: "SCHEDULED",
      createdBy: admin.id,
      createdByName: admin.name || "Board Secretary",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("board_meetings").insertOne(doc);

    const when = formatBoardDate(scheduledDate);
    await notifyBoardMembers(
      db,
      members,
      {
        type: "board_meeting_scheduled",
        title: "Board meeting scheduled",
        body: `${title} — ${when}.`,
        data: { meetingId: result.insertedId.toString() },
        email: {
          subject: `Board meeting scheduled: ${title}`,
          paragraphs: [
            `A board meeting has been scheduled.`,
            `When: ${when}`,
            `Where: ${location}`,
            ...(meetingLink ? [`Join online: ${meetingLink}`] : []),
            ...(agenda.length
              ? ["Agenda:", ...agendaEmailLines(agenda)]
              : []),
            "Open the board governance portal to confirm your attendance or send apologies.",
          ],
        },
      },
      admin.id,
    );

    return NextResponse.json(
      { data: serializeMeeting({ ...doc, _id: result.insertedId }) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to schedule the meeting" },
      { status: 500 },
    );
  }
}
