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
      .collection("community_requests")
      .updateOne(
        { _id: new ObjectId(id) },
        { $inc: { prayCount: 1 }, $set: { prayedByMe: true } },
      );
    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    const req = await db.collection("community_requests").findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ data: req });
  } catch {
    return NextResponse.json({ error: "Failed to record prayer" }, { status: 500 });
  }
}
