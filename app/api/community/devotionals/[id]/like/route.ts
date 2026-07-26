import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await db.collection("community_devotionals").findOne({ _id: new ObjectId(id) });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const alreadyLiked = (existing.likedByIds || []).includes(user.id);

    if (alreadyLiked) {
      await db.collection("community_devotionals").updateOne(
        { _id: new ObjectId(id) },
        { $pull: { likedByIds: user.id }, $inc: { likeCount: -1 } },
      );
    } else {
      await db.collection("community_devotionals").updateOne(
        { _id: new ObjectId(id) },
        { $addToSet: { likedByIds: user.id }, $inc: { likeCount: 1 } },
      );
    }

    return NextResponse.json({ data: { liked: !alreadyLiked } });
  } catch {
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
