import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
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
      imageUrl: e.imageUrl || null,
      author: e.author || "",
      userId: e.userId || null,
      attending: e.attending || 0,
      hasRsvpd: userId ? (e.rsvpUserIds || []).includes(userId) : false,
      isOwner: userId ? e.userId === userId : false,
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
    const userId = await resolveUser(request);
    const data = await request.json();
    const doc = {
      title: data.title,
      description: data.description || "",
      date: data.date || "",
      time: data.time || "",
      location: data.location || "",
      fee: data.fee || "Free",
      imageUrl: data.imageUrl || null,
      author: data.author || "Anonymous",
      userId: userId || null,
      attending: 0,
      rsvpUserIds: [],
      createdAt: new Date(),
    };
    const result = await db.collection("community_events").insertOne(doc);
    return NextResponse.json(
      { data: { _id: result.insertedId, ...doc, hasRsvpd: false, isOwner: !!userId } },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("Failed to create event:", err);
    return NextResponse.json({ error: err?.message || "Failed to create event" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const userId = await resolveUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { _id, ...updateData } = await request.json();
    if (!ObjectId.isValid(_id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await db.collection("community_events").findOne({ _id: new ObjectId(_id) });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (existing.userId && existing.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const setFields: Record<string, any> = { updatedAt: new Date() };
    if (updateData.title !== undefined) setFields.title = updateData.title;
    if (updateData.description !== undefined) setFields.description = updateData.description;
    if (updateData.date !== undefined) setFields.date = updateData.date;
    if (updateData.time !== undefined) setFields.time = updateData.time;
    if (updateData.location !== undefined) setFields.location = updateData.location;
    if (updateData.fee !== undefined) setFields.fee = updateData.fee;
    if (updateData.imageUrl !== undefined) setFields.imageUrl = updateData.imageUrl;

    await db.collection("community_events").updateOne(
      { _id: new ObjectId(_id) },
      { $set: setFields },
    );

    const updated = await db.collection("community_events").findOne({ _id: new ObjectId(_id) });
    return NextResponse.json({
      data: {
        ...updated,
        hasRsvpd: (updated?.rsvpUserIds || []).includes(userId),
        isOwner: true,
      },
    });
  } catch (err: any) {
    console.error("Failed to update event:", err);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    const userId = await resolveUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { _id } = await request.json();
    if (!ObjectId.isValid(_id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await db.collection("community_events").findOne({ _id: new ObjectId(_id) });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (existing.userId && existing.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.collection("community_events").deleteOne({ _id: new ObjectId(_id) });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
