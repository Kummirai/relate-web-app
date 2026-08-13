import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { createNotification } from "@/lib/inapp-notify";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";

/**
 * Joins a group by its shareable invite code (e.g. shared over chat or in
 * person). Mirrors the join logic of /api/community/groups/[id]/join but
 * resolves the group by code instead of id.
 */
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const group = await db.collection("community_groups").findOne({ inviteCode: code });
    if (!group) {
      return NextResponse.json(
        { error: "No group found with that code" },
        { status: 404 },
      );
    }

    const alreadyJoined = (group.joinedUserIds || []).includes(user.id);
    if (!alreadyJoined) {
      await db.collection("community_groups").updateOne(
        { _id: group._id },
        { $addToSet: { joinedUserIds: user.id }, $inc: { members: 1 } },
      );

      if (group.userId && group.userId !== user.id) {
        try {
          const actorName = user.name || "Someone";
          const title = "New member in your group";
          const body = `${actorName} joined ${group.name || "your group"}`;
          const data = { tab: "spiritual", section: "groups", itemId: group._id.toString() };
          await Promise.all([
            createNotification(db, group.userId, {
              type: "group_join",
              title,
              body,
              data,
            }),
            sendPushNotifications(
              await getUserPushTokens(db, group.userId),
              title,
              body,
              data,
            ),
          ]);
        } catch {}
      }
    }

    return NextResponse.json({
      data: {
        _id: group._id,
        id: group._id.toString(),
        name: group.name,
        hasJoined: true,
        isOwner: group.userId === user.id,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to join group" }, { status: 500 });
  }
}
