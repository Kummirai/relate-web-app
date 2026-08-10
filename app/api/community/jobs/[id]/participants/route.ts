import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  fetchParticipants,
  resolveAdminOrOwner,
} from "@/lib/community-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const db = await getDb();

    const job = await db.collection("community_jobs").findOne({ _id: new ObjectId(id) });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const access = await resolveAdminOrOwner(request, {
      userId: job.userId,
      author: job.author,
    });
    if (!access) {
      return NextResponse.json(
        { error: "Only the job owner or an admin can view applicants" },
        { status: 403 },
      );
    }

    const applications = await db
      .collection("community_job_applications")
      .find({ jobId: id })
      .sort({ createdAt: -1 })
      .toArray();
    const userIds = applications.map((a: any) => a.userId);
    const participants = await fetchParticipants(db, userIds);
    const appByUser = new Map<string, any>(
      applications.filter((a: any) => a.userId).map((a: any) => [a.userId, a]),
    );

    const data = userIds.map((uid: string) => {
      const base = participants.get(uid);
      const app = appByUser.get(uid);
      return {
        id: uid,
        name: base?.name || "Anonymous",
        email: base?.email || "",
        image: base?.image || null,
        appliedAt: app?.createdAt || null,
      };
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
