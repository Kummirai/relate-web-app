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

    const req = await db.collection("community_requests").findOne({ _id: new ObjectId(id) });
    if (!req) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const alreadyPrayed = (req.prayedUserIds || []).includes(userId);

    if (alreadyPrayed) {
      await db.collection("community_requests").updateOne(
        { _id: new ObjectId(id) },
        { $pull: { prayedUserIds: userId }, $inc: { prayCount: -1 } },
      );
    } else {
      await db.collection("community_requests").updateOne(
        { _id: new ObjectId(id) },
        { $addToSet: { prayedUserIds: userId }, $inc: { prayCount: 1 } },
      );

      if (req.userId && req.userId !== userId) {
        await db.collection("user_activity").insertOne({
          userId: req.userId,
          actorId: userId,
          type: "pray",
          section: "requests",
          itemId: id,
          itemTitle: req.title || req.name || "Prayer Request",
          createdAt: new Date(),
        });

        // Let the requester know someone prayed for them (in-app + push).
        const actorName = user?.name || "Someone";
        const body = `${actorName} is praying for your request`;
        await Promise.all([
          createNotification(db, req.userId, {
            type: "prayer_prayed",
            title: "Someone is praying for you",
            body,
            data: { section: "requests", requestId: id },
          }),
          sendPushNotifications(
            await getUserPushTokens(db, req.userId),
            "Someone is praying for you",
            body,
            { section: "requests", requestId: id },
          ),
        ]);
      }
    }

    const updated = await db.collection("community_requests").findOne({ _id: new ObjectId(id) });
    return NextResponse.json({
      data: {
        ...updated,
        prayedByMe: !alreadyPrayed,
        prayCount: updated?.prayCount || 0,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to toggle prayer" }, { status: 500 });
  }
}
