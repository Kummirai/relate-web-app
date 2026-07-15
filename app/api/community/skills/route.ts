import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const skills = await db
      .collection("community_skills")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({ data: skills });
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
    return NextResponse.json({ data: { _id: result.insertedId, ...doc } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create skill" }, { status: 500 });
  }
}
