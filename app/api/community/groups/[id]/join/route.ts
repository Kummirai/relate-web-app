import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { resolveSession } from "@/lib/community-auth";
import { createNotification } from "@/lib/inapp-notify";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const user = await resolveSession(request);
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const group = await db.collection("community_groups").findOne({ _id: new ObjectId(id) });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const alreadyJoined = (group.joinedUserIds || []).includes(userId);

    if (alreadyJoined) {
      await db.collection("community_groups").updateOne(
        { _id: new ObjectId(id) },
        { $pull: { joinedUserIds: userId }, $inc: { members: -1 } },
      );
    } else {
      await db.collection("community_groups").updateOne(
        { _id: new ObjectId(id) },
        { $addToSet: { joinedUserIds: userId }, $inc: { members: 1 }, $set: { live: true } },
      );

      if (group.userId && group.userId !== userId) {
        await db.collection("user_activity").insertOne({
          userId: group.userId,
          actorId: userId,
          type: "join",
          section: "groups",
          itemId: id,
          itemTitle: group.title || "Group",
          createdAt: new Date(),
        });

        // Let the group owner know someone joined (in-app + device banner).
        // Awaited so Vercel doesn't freeze the function before delivery.
        try {
          const actorName = user?.name || "Someone";
          const title = "New member in your group";
          const body = `${actorName} joined ${group.title || "your prayer group"}`;
          const data = { tab: "spiritual", section: "groups", itemId: id };
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

    const updated = await db.collection("community_groups").findOne({ _id: new ObjectId(id) });
    return NextResponse.json({
      data: {
        ...updated,
        hasJoined: !alreadyJoined,
        members: updated?.members || 0,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to toggle join" }, { status: 500 });
  }
}
