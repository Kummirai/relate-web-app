import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveUser } from "@/lib/community-auth";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const userId = await resolveUser(request);
    const groups = await db
      .collection("community_groups")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    const data = groups.map((g: any) => ({
      _id: g._id,
      name: g.name,
      description: g.description,
      members: g.members || 0,
      live: g.live || false,
      hasJoined: userId ? (g.joinedUserIds || []).includes(userId) : false,
      createdAt: g.createdAt,
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
      members: 0,
      joinedUserIds: [],
      live: false,
      createdAt: new Date(),
    };
    const result = await db.collection("community_groups").insertOne(doc);
    return NextResponse.json({ data: { _id: result.insertedId, ...doc, hasJoined: false } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
