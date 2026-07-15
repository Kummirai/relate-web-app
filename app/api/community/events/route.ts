import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const events = await db
      .collection("community_events")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({ data: events });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const data = await request.json();
    const doc = {
      ...data,
      attending: data.attending || 0,
      rsvpd: false,
      createdAt: new Date(),
    };
    const result = await db.collection("community_events").insertOne(doc);
    return NextResponse.json({ data: { _id: result.insertedId, ...doc } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
