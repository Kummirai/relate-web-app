import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { resolveUser } from "@/lib/community-auth";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const userId = await resolveUser(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.collection("community_skill_connections").findOne({
      skillId: id,
      userId,
    });

    if (existing) {
      await db.collection("community_skill_connections").deleteOne({ _id: existing._id });
      return NextResponse.json({ data: { connected: false } });
    }

    await db.collection("community_skill_connections").insertOne({
      skillId: id,
      userId,
      createdAt: new Date(),
    });
    return NextResponse.json({ data: { connected: true } });
  } catch {
    return NextResponse.json({ error: "Failed to toggle connection" }, { status: 500 });
  }
}
