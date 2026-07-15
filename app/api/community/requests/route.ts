import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const requests = await db
      .collection("community_requests")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({ data: requests });
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
      prayCount: data.prayCount || 0,
      prayedByMe: false,
      createdAt: new Date(),
    };
    const result = await db.collection("community_requests").insertOne(doc);
    return NextResponse.json({ data: { _id: result.insertedId, ...doc } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
