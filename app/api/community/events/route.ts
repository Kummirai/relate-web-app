import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveUser } from "@/lib/community-auth";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const userId = await resolveUser(request);
    const events = await db
      .collection("community_events")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    const data = events.map((e: any) => ({
      _id: e._id,
      title: e.title,
      date: e.date,
      time: e.time,
      location: e.location,
      description: e.description,
      fee: e.fee || "Free",
      author: e.author || "",
      attending: e.attending || 0,
      hasRsvpd: userId ? (e.rsvpUserIds || []).includes(userId) : false,
      createdAt: e.createdAt,
    }));
    return NextResponse.json({ data });
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
      attending: 0,
      rsvpUserIds: [],
      createdAt: new Date(),
    };
    const result = await db.collection("community_events").insertOne(doc);
    return NextResponse.json({ data: { _id: result.insertedId, ...doc, hasRsvpd: false } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
