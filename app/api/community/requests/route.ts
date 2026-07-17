import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveUser } from "@/lib/community-auth";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const userId = await resolveUser(request);
    const requests = await db
      .collection("community_requests")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    const data = requests.map((r: any) => ({
      _id: r._id,
      title: r.title || r.text,
      text: r.text,
      description: r.description || r.text,
      author: r.author,
      prayCount: r.prayCount || 0,
      prayedByMe: userId ? (r.prayedUserIds || []).includes(userId) : false,
      createdAt: r.createdAt,
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
      prayCount: 0,
      prayedUserIds: [],
      createdAt: new Date(),
    };
    const result = await db.collection("community_requests").insertOne(doc);
    return NextResponse.json({ data: { _id: result.insertedId, ...doc, prayedByMe: false } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
