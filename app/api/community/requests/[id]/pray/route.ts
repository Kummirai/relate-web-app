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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const req = await db.collection("community_requests").findOne({ _id: new ObjectId(id) });
    if (!req) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const alreadyPrayed = (req.prayedUserIds || []).includes(userId);

    if (alreadyPrayed) {
      await db.collection("community_requests").updateOne(
        { _id: new ObjectId(id) },
        { $pull: { prayedUserIds: userId }, $inc: { prayCount: -1 } },
      );
    } else {
      await db.collection("community_requests").updateOne(
        { _id: new ObjectId(id) },
        { $addToSet: { prayedUserIds: userId }, $inc: { prayCount: 1 } },
      );
    }

    const updated = await db.collection("community_requests").findOne({ _id: new ObjectId(id) });
    return NextResponse.json({
      data: {
        ...updated,
        prayedByMe: !alreadyPrayed,
        prayCount: updated?.prayCount || 0,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to toggle prayer" }, { status: 500 });
  }
}
