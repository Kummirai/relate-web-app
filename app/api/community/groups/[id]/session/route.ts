import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession, resolveAdminOrOwner } from "@/lib/community-auth";
import {
  createDailyMeetingToken,
  createDailyRoom,
  deleteDailyRoom,
  isDailyConfigured,
  makeAccessCode,
} from "@/lib/daily";
import { createNotification } from "@/lib/inapp-notify";
import { sendPushNotifications } from "@/lib/push";

/**
 * Live sessions for a group (Daily.co audio/video calls).
 *
 * - POST { action: "start", type: "audio" | "video" } — owner/admin only.
 *   Creates a private Daily room, stores it as the group's `activeSession`,
 *   flips `live: true`, and notifies every joined member (in-app + push)
 *   with the session's access code.
 * - POST { action: "join", accessCode? } — any signed-in user who is either a
 *   group member or enters the session's access code. Mints a Daily meeting
 *   token and returns the room URL + token so the client can join the call.
 * - DELETE — owner/admin only. Ends the session and deletes the Daily room.
 */

const SESSION_DURATION_MS = 3 * 60 * 60 * 1000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const group = await db
      .collection("community_groups")
      .findOne({ _id: new ObjectId(id) });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || "join";

    if (action === "start") {
      const access = await resolveAdminOrOwner(request, {
        userId: group.userId,
        author: group.author,
      });
      if (!access) {
        return NextResponse.json(
          { error: "Only the group moderator can start a session" },
          { status: 403 },
        );
      }
      if (!isDailyConfigured()) {
        return NextResponse.json(
          { error: "Live sessions are not configured yet" },
          { status: 503 },
        );
      }

      const sessionType = body.type === "audio" ? "audio" : "video";
      const startedAt = new Date();

      // Reuse an already-running session so the moderator doesn't spawn
      // duplicate rooms by tapping start twice.
      if (group.live && group.activeSession) {
        const existing = group.activeSession;
        const token = await createDailyMeetingToken({
          roomName: existing.roomName,
          userName: user.name || "Group moderator",
          isOwner: true,
        });
        return NextResponse.json({
          data: { ...existing, token, isOwner: true },
        });
      }

      const room = await createDailyRoom({
        groupId: group._id.toString(),
        type: sessionType,
        maxParticipants: group.maxMembers || 0,
        durationMs: SESSION_DURATION_MS,
      });

      const accessCode = makeAccessCode();
      const activeSession = {
        sessionId: `${group._id.toString()}-${startedAt.getTime()}`,
        roomName: room.name,
        roomUrl: room.url,
        type: sessionType,
        accessCode,
        startedBy: user.id,
        startedByName: user.name || "Group moderator",
        startedAt,
      };

      await db.collection("community_groups").updateOne(
        { _id: new ObjectId(id) },
        { $set: { live: true, activeSession } },
      );

      // Notify every joined member (except the moderator who started it) so
      // they can jump into the call with the access code.
      const memberIds = (group.joinedUserIds || []).filter(
        (uid: string) => uid && uid !== user.id,
      );
      const title = `${group.name || "A group"} is live`;
      const notifBody =
        `${sessionType === "video" ? "Video" : "Audio"} session started — ` +
        `join with code ${accessCode}`;
      const data = {
        tab: "spiritual",
        section: "groups",
        itemId: id,
        sessionId: activeSession.sessionId,
        groupName: group.name || "",
      };
      for (const uid of memberIds) {
        await createNotification(db, uid, {
          type: "group_session_start",
          title,
          body: notifBody,
          data,
        });
      }
      if (memberIds.length) {
        const tokens = (
          await db.collection("push_tokens").find({ userId: { $in: memberIds } }).toArray()
        )
          .map((t: any) => t.token)
          .filter(Boolean);
        await sendPushNotifications(tokens, title, notifBody, data);
      }

      const ownerToken = await createDailyMeetingToken({
        roomName: room.name,
        userName: user.name || "Group moderator",
        isOwner: true,
      });

      return NextResponse.json(
        { data: { ...activeSession, token: ownerToken, isOwner: true } },
        { status: 201 },
      );
    }

    // action === "join"
    if (!group.live || !group.activeSession) {
      return NextResponse.json(
        { error: "This group has no live session right now" },
        { status: 404 },
      );
    }
    const session = group.activeSession;
    const isMember = (group.joinedUserIds || []).includes(user.id);
    const enteredCode = String(body.accessCode || "").trim().toUpperCase();
    if (!isMember && enteredCode !== session.accessCode) {
      return NextResponse.json(
        {
          error:
            "This session is for group members. Join the group or enter the correct access code.",
        },
        { status: 403 },
      );
    }

    const token = await createDailyMeetingToken({
      roomName: session.roomName,
      userName: user.name || "Group member",
    });

    return NextResponse.json({
      data: { ...session, token, isOwner: false },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to start/join session" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const group = await db
      .collection("community_groups")
      .findOne({ _id: new ObjectId(id) });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const access = await resolveAdminOrOwner(request, {
      userId: group.userId,
      author: group.author,
    });
    if (!access) {
      return NextResponse.json(
        { error: "Only the group moderator can end a session" },
        { status: 403 },
      );
    }

    const session = group.activeSession;
    await db.collection("community_groups").updateOne(
      { _id: new ObjectId(id) },
      { $set: { live: false }, $unset: { activeSession: "" } },
    );
    if (session?.roomName) {
      await deleteDailyRoom(session.roomName);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500 },
    );
  }
}
