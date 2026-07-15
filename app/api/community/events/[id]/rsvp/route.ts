import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db
      .collection("community_events")
      .updateOne(
        { _id: new ObjectId(id) },
        { $inc: { attending: 1 }, $set: { rsvpd: true } },
      );
    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const event = await db.collection("community_events").findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ data: event });
  } catch {
    return NextResponse.json({ error: "Failed to RSVP" }, { status: 500 });
  }
}
