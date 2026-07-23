import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveUser } from "@/lib/community-auth";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const [userId, session] = await Promise.all([
      resolveUser(request),
      auth.api.getSession({ headers: request.headers }).catch(() => null),
    ]);
    const userName = session?.user?.name || null;

    const skills = await db
      .collection("community_skills")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    let connectedIds: string[] = [];
    if (userId) {
      const connections = await db
        .collection("community_skill_connections")
        .find({ userId })
        .toArray();
      connectedIds = connections.map((c: any) => c.skillId);
    }

    const data = await Promise.all(skills.map(async (s: any) => {
      const connectionCount = await db
        .collection("community_skill_connections")
        .countDocuments({ skillId: s._id.toString() });

      return {
        _id: s._id,
        title: s.title,
        category: s.category,
        description: s.description,
        author: s.author,
        offering: s.offering,
        connected: connectedIds.includes(s._id.toString()),
        connectionCount,
        isOwner: userId
          ? s.userId === userId || (!s.userId && !!userName && s.author === userName)
          : false,
        createdAt: s.createdAt,
      };
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
      category: data.category || "",
      description: data.description || "",
      offering: data.offering ?? true,
      author: data.author || "Anonymous",
      userId: userId || null,
      createdAt: new Date(),
    };
    const result = await db.collection("community_skills").insertOne(doc);
    return NextResponse.json(
      { data: { _id: result.insertedId, ...doc, connected: false, connectionCount: 0, isOwner: !!userId } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to create skill" }, { status: 500 });
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

    const existing = await db.collection("community_skills").findOne({ _id: new ObjectId(_id) });
    if (!existing) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

    const canEdit = existing.userId === userId || (!existing.userId && !!userName && existing.author === userName);
    if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const setFields: Record<string, any> = { updatedAt: new Date() };
    if (updateData.title !== undefined) setFields.title = updateData.title;
    if (updateData.description !== undefined) setFields.description = updateData.description;
    if (updateData.category !== undefined) setFields.category = updateData.category;
    if (updateData.offering !== undefined) setFields.offering = updateData.offering;

    await db.collection("community_skills").updateOne(
      { _id: new ObjectId(_id) },
      { $set: setFields },
    );

    const updated = await db.collection("community_skills").findOne({ _id: new ObjectId(_id) });
    return NextResponse.json({ data: { ...updated, isOwner: true } });
  } catch {
    return NextResponse.json({ error: "Failed to update skill" }, { status: 500 });
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

    const existing = await db.collection("community_skills").findOne({ _id: new ObjectId(_id) });
    if (!existing) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

    const canDelete = existing.userId === userId || (!existing.userId && !!userName && existing.author === userName);
    if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.collection("community_skills").deleteOne({ _id: new ObjectId(_id) });
    await db.collection("community_skill_connections").deleteMany({ skillId: _id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete skill" }, { status: 500 });
  }
}
