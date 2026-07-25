import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession, ensureIndexes, fetchParticipants } from "@/lib/community-auth";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    await ensureIndexes(db);
    const user = await resolveSession(request);
    const userId = user?.id || null;

    const requests = await db
      .collection("community_requests")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const allUserIds = requests.flatMap((r: any) => r.prayedUserIds || []);
    const participants = await fetchParticipants(db, allUserIds);

    const data = requests.map((r: any) => {
      const prayedUsers = (r.prayedUserIds || [])
        .map((id: string) => participants.get(id))
        .filter(Boolean);
      return {
        _id: r._id,
        title: r.title || r.text,
        text: r.text,
        description: r.description || r.text,
        author: r.author,
        userId: r.userId || null,
        prayCount: r.prayCount || 0,
        prayedByMe: userId ? (r.prayedUserIds || []).includes(userId) : false,
        prayedUsers,
        isOwner: userId
          ? r.userId === userId || (!r.userId && !!user.name && r.author === user.name)
          : false,
        createdAt: r.createdAt,
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
    const user = await resolveSession(request);
    const userId = user?.id || null;
    const data = await request.json();
    const doc = {
      title: data.title || "",
      text: data.text || "",
      description: data.description || "",
      author: data.author || "Anonymous",
      userId: userId || null,
      prayCount: 0,
      prayedUserIds: [],
      createdAt: new Date(),
    };
    const result = await db.collection("community_requests").insertOne(doc);
    return NextResponse.json(
      { data: { _id: result.insertedId, ...doc, prayedByMe: false, isOwner: !!userId } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;
    const userName = user.name;

    const { _id, ...updateData } = await request.json();
    if (!ObjectId.isValid(_id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await db.collection("community_requests").findOne({ _id: new ObjectId(_id) });
    if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const canEdit = existing.userId === userId || (!existing.userId && !!userName && existing.author === userName);
    if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const setFields: Record<string, any> = { updatedAt: new Date() };
    if (updateData.title !== undefined) setFields.title = updateData.title;
    if (updateData.text !== undefined) setFields.text = updateData.text;
    if (updateData.description !== undefined) setFields.description = updateData.description;

    await db.collection("community_requests").updateOne(
      { _id: new ObjectId(_id) },
      { $set: setFields },
    );

    const updated = await db.collection("community_requests").findOne({ _id: new ObjectId(_id) });
    return NextResponse.json({ data: { ...updated, isOwner: true } });
  } catch {
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;
    const userName = user.name;

    const { _id } = await request.json();
    if (!ObjectId.isValid(_id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await db.collection("community_requests").findOne({ _id: new ObjectId(_id) });
    if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const canDelete = existing.userId === userId || (!existing.userId && !!userName && existing.author === userName);
    if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.collection("community_requests").deleteOne({ _id: new ObjectId(_id) });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete request" }, { status: 500 });
  }
}
