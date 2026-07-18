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

    const existing = await db.collection("community_job_applications").findOne({
      jobId: id,
      userId,
    });

    if (existing) {
      await db.collection("community_job_applications").deleteOne({ _id: existing._id });
      return NextResponse.json({ data: { applied: false } });
    }

    await db.collection("community_job_applications").insertOne({
      jobId: id,
      userId,
      createdAt: new Date(),
    });
    return NextResponse.json({ data: { applied: true } });
  } catch {
    return NextResponse.json({ error: "Failed to toggle application" }, { status: 500 });
  }
}
