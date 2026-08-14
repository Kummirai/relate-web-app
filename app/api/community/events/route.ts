import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  resolveSession,
  ensureIndexes,
  fetchParticipants,
  requireAdmin,
} from "@/lib/community-auth";

const AGENDA_KEYS = [
  "time",
  "title",
  "description",
  "dateFrom",
  "dateTo",
  "timeFrom",
  "timeTo",
] as const;

function sanitizeAgenda(value: any) {
  if (!Array.isArray(value)) return [];
  return value
    .map((a: any) => {
      const item: Record<string, string | undefined> = {};
      for (const key of AGENDA_KEYS) {
        const v = a?.[key];
        item[key] = typeof v === "string" ? v.trim() || undefined : undefined;
      }
      return item;
    })
    .filter((a: any) => a.title || a.time);
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    await ensureIndexes(db);
    const user = await resolveSession(request);
    const userId = user?.id || null;

    const events = await db
      .collection("community_events")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const allUserIds = events.flatMap((e: any) => e.rsvpUserIds || []);
    const participants = await fetchParticipants(db, allUserIds);

    let bookmarkedIds = new Set<string>();
    if (userId) {
      const bookmarks = await db
        .collection("user_bookmarks")
        .find({ userId, section: "events" })
        .toArray();
      bookmarkedIds = new Set(bookmarks.map((b: any) => b.itemId));
    }

    const data = events.map((e: any) => {
      const rsvpUsers = (e.rsvpUserIds || [])
        .map((id: string) => participants.get(id))
        .filter(Boolean);
      return {
        _id: e._id,
        title: e.title,
        date: e.date,
        time: e.time,
        dateTo: e.dateTo || undefined,
        timeTo: e.timeTo || undefined,
        agenda: Array.isArray(e.agenda) ? e.agenda : [],
        notes: e.notes || "",
        location: e.location,
        description: e.description,
        fee: e.fee || "Free",
        imageUrl: e.imageUrl || null,
        author: e.author || "",
        userId: e.userId || null,
        attending: e.attending || 0,
        hasRsvpd: userId ? (e.rsvpUserIds || []).includes(userId) : false,
        isBookmarked: userId ? bookmarkedIds.has(e._id.toString()) : false,
        rsvpUsers,
        isOwner: userId
          ? e.userId === userId || (!e.userId && !!user.name && e.author === user.name)
          : false,
        createdAt: e.createdAt,
      };
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const admin = await requireAdmin(request);
    if (!admin) {
      const user = await resolveSession(request);
      return NextResponse.json(
        { error: user ? "Only admins can create events" : "Unauthorized" },
        { status: user ? 403 : 401 },
      );
    }
    const userId = admin.id;
    const data = await request.json();
    const doc = {
      title: data.title,
      description: data.description || "",
      date: data.date || "",
      time: data.time || "",
      dateTo: data.dateTo || undefined,
      timeTo: data.timeTo || undefined,
      agenda: sanitizeAgenda(data.agenda),
      notes: data.notes || "",
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
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;
    const userName = user.name;

    const isAdmin = !!(await requireAdmin(request));

    const { _id, ...updateData } = await request.json();
    if (!ObjectId.isValid(_id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await db.collection("community_events").findOne({ _id: new ObjectId(_id) });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const canEdit =
      isAdmin ||
      existing.userId === userId ||
      (!existing.userId && !!userName && existing.author === userName);
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const setFields: Record<string, any> = { updatedAt: new Date() };
    if (updateData.title !== undefined) setFields.title = updateData.title;
    if (updateData.description !== undefined) setFields.description = updateData.description;
    if (updateData.date !== undefined) setFields.date = updateData.date;
    if (updateData.time !== undefined) setFields.time = updateData.time;
    if (updateData.dateTo !== undefined) setFields.dateTo = updateData.dateTo;
    if (updateData.timeTo !== undefined) setFields.timeTo = updateData.timeTo;
    if (updateData.agenda !== undefined) setFields.agenda = sanitizeAgenda(updateData.agenda);
    if (updateData.notes !== undefined) setFields.notes = updateData.notes;
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
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;
    const userName = user.name;

    const isAdmin = !!(await requireAdmin(request));

    const { _id } = await request.json();
    if (!ObjectId.isValid(_id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await db.collection("community_events").findOne({ _id: new ObjectId(_id) });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const canDelete =
      isAdmin ||
      existing.userId === userId ||
      (!existing.userId && !!userName && existing.author === userName);
    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.collection("community_events").deleteOne({ _id: new ObjectId(_id) });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
