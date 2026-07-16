import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveUser } from "@/lib/community-auth";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const userId = await resolveUser(request);
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

    const data = skills.map((s: any) => ({
      _id: s._id,
      title: s.title,
      category: s.category,
      description: s.description,
      author: s.author,
      offering: s.offering,
      connected: connectedIds.includes(s._id.toString()),
      createdAt: s.createdAt,
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
      createdAt: new Date(),
    };
    const result = await db.collection("community_skills").insertOne(doc);
    return NextResponse.json({ data: { _id: result.insertedId, ...doc, connected: false } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create skill" }, { status: 500 });
  }
}
