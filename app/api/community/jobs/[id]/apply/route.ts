import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { resolveSession } from "@/lib/community-auth";
import { createNotification } from "@/lib/inapp-notify";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const user = await resolveSession(request);
    const userId = user?.id;

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

    const job = await db.collection("community_jobs").findOne({ _id: new ObjectId(id) });
    if (job && job.userId && job.userId !== userId) {
      await db.collection("user_activity").insertOne({
        userId: job.userId,
        actorId: userId,
        type: "apply",
        section: "jobs",
        itemId: id,
        itemTitle: job.title || "Job",
        createdAt: new Date(),
      });

      // Let the job owner know someone applied (in-app + device banner).
      // Awaited so Vercel doesn't freeze the function before delivery.
      try {
        const actorName = user?.name || "Someone";
        const title = "New job application";
        const body = `${actorName} applied for ${job.title || "your job"}`;
        const data = { tab: "skills", filter: "jobs", itemId: id };
        await Promise.all([
          createNotification(db, job.userId, {
            type: "job_apply",
            title,
            body,
            data,
          }),
          sendPushNotifications(
            await getUserPushTokens(db, job.userId),
            title,
            body,
            data,
          ),
        ]);
      } catch {}
    }

    return NextResponse.json({ data: { applied: true } });
  } catch {
    return NextResponse.json({ error: "Failed to toggle application" }, { status: 500 });
  }
}
