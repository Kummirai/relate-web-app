import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import {
  applyAttendance,
  composeMinutesSummary,
  formatBoardDate,
  listBoardMembers,
  minutesWindow,
  notifyBoardMember,
  notifyBoardMembers,
  parseDate,
  pickText,
  sanitizeActionItems,
  sanitizeMinutesSections,
  serializeMinutes,
  serializeMinutesSummary,
} from "@/lib/board-governance";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Published minutes archive. Search covers the summary, decisions and every
 * action item; `filter` narrows by task state and the 48-hour rule.
 * `view=cards` returns only the list-card fields so the mobile archive can
 * show a whole year of sittings without loading every decision.
 *
 * GET /api/board/minutes?search=&filter=all|pending|on-time|late&view=cards
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const filterKey = searchParams.get("filter") || "all";
    const meetingId = searchParams.get("meetingId");
    const cardsOnly = searchParams.get("view") === "cards";

    const query: any = {};
    if (meetingId) query.meetingId = meetingId;
    if (filterKey === "pending") query["actionItems.status"] = { $ne: "DONE" };
    if (filterKey === "on-time") query.within48h = true;
    if (filterKey === "late") query.within48h = false;
    if (search.length >= 2) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { summary: regex },
        { meetingTitle: regex },
        { "sections.title": regex },
        { "sections.points": regex },
        { "actionItems.taskDescription": regex },
        { "actionItems.assigneeName": regex },
      ];
    }

    const docs = await db
      .collection("board_minutes")
      .find(query)
      .sort({ publishedAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({
      data: cardsOnly
        ? docs.map(serializeMinutesSummary)
        : docs.map(serializeMinutes),
      boardMembers: await listBoardMembers(db),
      currentUserId: admin.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load minutes" },
      { status: 500 },
    );
  }
}

/**
 * Secretary publishes minutes for a past meeting: attendance register, the
 * decision summary, the signed document URL and the action items raised.
 *
 * POST /api/board/minutes
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const meetingId = pickText(body?.meetingId, 64);
    if (!ObjectId.isValid(meetingId)) {
      return NextResponse.json({ error: "Choose a meeting" }, { status: 400 });
    }

    const sections = sanitizeMinutesSections(body?.sections);
    const summary = sections.length
      ? composeMinutesSummary(sections)
      : pickText(body?.summary, 20000);
    if (!summary) {
      return NextResponse.json(
        { error: "Write the meeting summary and key decisions" },
        { status: 400 },
      );
    }

    const documentUrl = pickText(body?.minutesDocumentUrl, 600);
    if (!/^https?:\/\//i.test(documentUrl)) {
      return NextResponse.json(
        { error: "Upload the signed minutes or paste a valid document link" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const meetings = db.collection("board_meetings");
    const meeting = await meetings.findOne({ _id: new ObjectId(meetingId) });
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    if (meeting.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This meeting was cancelled — there are no minutes to publish." },
        { status: 409 },
      );
    }

    const meetingDate = parseDate(meeting.scheduledDate);
    if (!meetingDate) {
      return NextResponse.json(
        { error: "This meeting has no valid date." },
        { status: 409 },
      );
    }
    const now = new Date();
    if (meetingDate.getTime() > now.getTime()) {
      return NextResponse.json(
        { error: "Minutes can only be logged after the meeting has taken place." },
        { status: 409 },
      );
    }

    const existing = await db
      .collection("board_minutes")
      .findOne({ meetingId });
    if (existing) {
      return NextResponse.json(
        { error: "Minutes for this meeting have already been published." },
        { status: 409 },
      );
    }

    const members = await listBoardMembers(db);
    const actionItems = sanitizeActionItems(body?.actionItems, members);
    const rsvps = applyAttendance(
      Array.isArray(meeting.rsvps) ? meeting.rsvps : [],
      body?.attendance,
    );
    const window = minutesWindow(meetingDate, now);

    const doc = {
      meetingId,
      meetingTitle: meeting.title || "Board meeting",
      meetingDate,
      publishedBy: admin.id,
      publishedByName: admin.name || "Board Secretary",
      publishedAt: now,
      hoursAfterMeeting: window.hoursAfterMeeting,
      within48h: window.within48h,
      summary,
      sections,
      minutesDocumentUrl: documentUrl,
      actionItems,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("board_minutes").insertOne(doc);

    await meetings.updateOne(
      { _id: meeting._id },
      {
        $set: {
          status: "COMPLETED",
          rsvps,
          minutesId: result.insertedId.toString(),
          minutesPublishedAt: now,
          updatedAt: now,
        },
      },
    );

    const when = formatBoardDate(meetingDate);
    const taskSummary = actionItems.length
      ? `${actionItems.length} action item${actionItems.length === 1 ? "" : "s"} assigned.`
      : "No action items were raised.";
    await notifyBoardMembers(
      db,
      members,
      {
        type: "board_minutes_published",
        title: "Board minutes published",
        body: `${doc.meetingTitle} — ${when}. ${taskSummary}`,
        data: { minutesId: result.insertedId.toString(), meetingId },
        email: {
          subject: `Board minutes published: ${doc.meetingTitle}`,
          paragraphs: [
            `Minutes from ${doc.meetingTitle} have been published.`,
            `Meeting: ${when}`,
            `Published by: ${doc.publishedByName}`,
            doc.within48h
              ? "Logged within the 48-hour governance window."
              : `Logged ${doc.hoursAfterMeeting} hours after the meeting — outside the 48-hour window.`,
            ...(actionItems.length
              ? [
                  "Action items:",
                  ...actionItems.map(
                    (item) =>
                      `• ${item.taskDescription} — ${item.assigneeName}${item.dueDate ? ` (due ${formatBoardDate(item.dueDate)})` : ""}`,
                  ),
                ]
              : []),
          ],
        },
      },
      admin.id,
    );

    // Each assignee also gets a direct nudge about their own tasks.
    const perAssignee = new Map<string, number>();
    for (const item of actionItems) {
      perAssignee.set(item.assigneeId, (perAssignee.get(item.assigneeId) || 0) + 1);
    }
    for (const member of members) {
      const count = perAssignee.get(member.id);
      if (!count || member.id === admin.id) continue;
      await notifyBoardMember(db, member, {
        type: "board_action_assigned",
        title: "Board action assigned",
        body: `${count} action item${count === 1 ? "" : "s"} from ${doc.meetingTitle}.`,
        data: { minutesId: result.insertedId.toString(), meetingId },
      });
    }

    return NextResponse.json(
      { data: serializeMinutes({ ...doc, _id: result.insertedId }) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to publish the minutes" },
      { status: 500 },
    );
  }
}
