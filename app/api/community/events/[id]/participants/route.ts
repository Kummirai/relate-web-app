import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { fetchParticipants } from "@/lib/community-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const db = await getDb();

    const event = await db.collection("community_events").findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const userIds = event.rsvpUserIds || [];
    const participants = await fetchParticipants(db, userIds);
    const data = Array.from(participants.values());

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
