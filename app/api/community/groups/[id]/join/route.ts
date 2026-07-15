import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db
      .collection("community_groups")
      .updateOne(
        { _id: new ObjectId(id) },
        { $inc: { members: 1 }, $set: { joined: true } },
      );
    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    const group = await db.collection("community_groups").findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ data: group });
  } catch {
    return NextResponse.json({ error: "Failed to join group" }, { status: 500 });
  }
}
