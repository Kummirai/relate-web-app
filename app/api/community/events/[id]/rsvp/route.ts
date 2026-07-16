import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { resolveUser } from "@/lib/community-auth";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const userId = await resolveUser(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await db.collection("community_events").findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const alreadyRsvpd = (event.rsvpUserIds || []).includes(userId);
    if (alreadyRsvpd) {
      const updated = await db.collection("community_events").findOne({ _id: new ObjectId(id) });
      return NextResponse.json({ data: { ...updated, hasRsvpd: true } });
    }

    await db.collection("community_events").updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { rsvpUserIds: userId }, $inc: { attending: 1 } },
    );
    const updated = await db.collection("community_events").findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ data: { ...updated, hasRsvpd: true } });
  } catch {
    return NextResponse.json({ error: "Failed to RSVP" }, { status: 500 });
  }
}
