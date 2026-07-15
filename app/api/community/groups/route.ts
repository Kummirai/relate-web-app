import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const groups = await db
      .collection("community_groups")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({ data: groups });
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
      members: data.members || 0,
      joined: false,
      createdAt: new Date(),
    };
    const result = await db.collection("community_groups").insertOne(doc);
    return NextResponse.json({ data: { _id: result.insertedId, ...doc } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
