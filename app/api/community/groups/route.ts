import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveUser, fetchParticipants } from "@/lib/community-auth";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const [userId, session] = await Promise.all([
      resolveUser(request),
      auth.api.getSession({ headers: request.headers }).catch(() => null),
    ]);
    const userName = session?.user?.name || null;

    const groups = await db
      .collection("community_groups")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const allUserIds = groups.flatMap((g: any) => g.joinedUserIds || []);
    const participants = await fetchParticipants(db, allUserIds);

    const data = groups.map((g: any) => {
      const joinedUsers = (g.joinedUserIds || [])
        .map((id: string) => participants.get(id))
        .filter(Boolean);
      return {
        _id: g._id,
        name: g.name,
        description: g.description,
        meetingTime: g.meetingTime || "",
        schedule: g.schedule || "",
        maxMembers: g.maxMembers || 0,
        members: g.members || 0,
        live: g.live || false,
        hasJoined: userId ? (g.joinedUserIds || []).includes(userId) : false,
        joinedUsers,
        isOwner: userId
          ? g.userId === userId || (!g.userId && !!userName && g.author === userName)
          : false,
        createdAt: g.createdAt,
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
    const userId = await resolveUser(request);
    const data = await request.json();
    const doc = {
      name: data.name || "",
      description: data.description || "",
      meetingTime: data.meetingTime || "",
      schedule: data.schedule || "",
      maxMembers: data.maxMembers || 0,
      author: data.author || "Anonymous",
      userId: userId || null,
      members: 0,
      joinedUserIds: [],
      live: false,
      createdAt: new Date(),
    };
    const result = await db.collection("community_groups").insertOne(doc);
    return NextResponse.json(
      { data: { _id: result.insertedId, ...doc, hasJoined: false, isOwner: !!userId } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const [userId, session] = await Promise.all([
      resolveUser(request),
      auth.api.getSession({ headers: request.headers }).catch(() => null),
    ]);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userName = session?.user?.name || null;

    const { _id, ...updateData } = await request.json();
    if (!ObjectId.isValid(_id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await db.collection("community_groups").findOne({ _id: new ObjectId(_id) });
    if (!existing) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const canEdit = existing.userId === userId || (!existing.userId && !!userName && existing.author === userName);
    if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const setFields: Record<string, any> = { updatedAt: new Date() };
    if (updateData.name !== undefined) setFields.name = updateData.name;
    if (updateData.description !== undefined) setFields.description = updateData.description;
    if (updateData.meetingTime !== undefined) setFields.meetingTime = updateData.meetingTime;
    if (updateData.schedule !== undefined) setFields.schedule = updateData.schedule;
    if (updateData.maxMembers !== undefined) setFields.maxMembers = updateData.maxMembers;

    await db.collection("community_groups").updateOne(
      { _id: new ObjectId(_id) },
      { $set: setFields },
    );

    const updated = await db.collection("community_groups").findOne({ _id: new ObjectId(_id) });
    return NextResponse.json({ data: { ...updated, isOwner: true } });
  } catch {
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    const [userId, session] = await Promise.all([
      resolveUser(request),
      auth.api.getSession({ headers: request.headers }).catch(() => null),
    ]);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userName = session?.user?.name || null;

    const { _id } = await request.json();
    if (!ObjectId.isValid(_id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await db.collection("community_groups").findOne({ _id: new ObjectId(_id) });
    if (!existing) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const canDelete = existing.userId === userId || (!existing.userId && !!userName && existing.author === userName);
    if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.collection("community_groups").deleteOne({ _id: new ObjectId(_id) });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}
