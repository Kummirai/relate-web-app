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

    const docs = await db
      .collection("community_devotionals")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const data = docs.map((d: any) => ({
      _id: d._id,
      title: d.title,
      author: d.author,
      authorId: d.authorId,
      content: d.content,
      scripture: d.scripture || "",
      theme: d.theme || "",
      likeCount: d.likeCount || 0,
      likedByMe: userId ? (d.likedByIds || []).includes(userId) : false,
      isOwner: userId
        ? d.authorId === userId
        : false,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    await ensureIndexes(db);
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    if (!data.title?.trim() || !data.content?.trim()) {
      return NextResponse.json({ error: "Title and content required" }, { status: 400 });
    }

    const doc = {
      title: data.title.trim(),
      author: user.name || "Anonymous",
      authorId: user.id,
      content: data.content.trim(),
      scripture: data.scripture?.trim() || "",
      theme: data.theme?.trim() || "",
      likeCount: 0,
      likedByIds: [],
      createdAt: new Date(),
    };

    const result = await db.collection("community_devotionals").insertOne(doc);
    return NextResponse.json(
      { data: { _id: result.insertedId, ...doc, likedByMe: false, isOwner: true } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to create devotional" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { _id } = await request.json();
    if (!ObjectId.isValid(_id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await db.collection("community_devotionals").findOne({ _id: new ObjectId(_id) });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.authorId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.collection("community_devotionals").deleteOne({ _id: new ObjectId(_id) });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
