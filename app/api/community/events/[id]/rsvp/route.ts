import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { resolveUser, resolveSession } from "@/lib/community-auth";
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

    const event = await db.collection("community_events").findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const alreadyRsvpd = (event.rsvpUserIds || []).includes(userId);

    if (alreadyRsvpd) {
      await db.collection("community_events").updateOne(
        { _id: new ObjectId(id) },
        { $pull: { rsvpUserIds: userId }, $inc: { attending: -1 } },
      );
    } else {
      await db.collection("community_events").updateOne(
        { _id: new ObjectId(id) },
        { $addToSet: { rsvpUserIds: userId }, $inc: { attending: 1 } },
      );

      if (event.userId && event.userId !== userId) {
        await db.collection("user_activity").insertOne({
          userId: event.userId,
          actorId: userId,
          type: "rsvp",
          section: "events",
          itemId: id,
          itemTitle: event.title || "Event",
          createdAt: new Date(),
        });
      }
    }

    const updated = await db.collection("community_events").findOne({ _id: new ObjectId(id) });
    return NextResponse.json({
      data: {
        ...updated,
        hasRsvpd: !alreadyRsvpd,
        attending: (updated?.attending || 0),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to RSVP" }, { status: 500 });
  }
}
