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

    const existing = await db.collection("community_skill_connections").findOne({
      skillId: id,
      userId,
    });

    if (existing) {
      await db.collection("community_skill_connections").deleteOne({ _id: existing._id });
      return NextResponse.json({ data: { connected: false } });
    }

    await db.collection("community_skill_connections").insertOne({
      skillId: id,
      userId,
      createdAt: new Date(),
    });

    const skill = await db.collection("community_skills").findOne({ _id: new ObjectId(id) });
    if (skill && skill.userId && skill.userId !== userId) {
      await db.collection("user_activity").insertOne({
        userId: skill.userId,
        actorId: userId,
        type: "connect",
        section: "skills",
        itemId: id,
        itemTitle: skill.title || "Skill",
        createdAt: new Date(),
      });

      // Let the skill owner know someone wants to connect (in-app + device banner).
      // Awaited so Vercel doesn't freeze the function before delivery.
      try {
        const actorName = user?.name || "Someone";
        const title = "New connection on your skill";
        const body = `${actorName} wants to connect — ${skill.title || "Skill"}`;
        const data = { tab: "skills", itemId: id };
        await Promise.all([
          createNotification(db, skill.userId, {
            type: "skill_connect",
            title,
            body,
            data,
          }),
          sendPushNotifications(
            await getUserPushTokens(db, skill.userId),
            title,
            body,
            data,
          ),
        ]);
      } catch {}
    }

    return NextResponse.json({ data: { connected: true } });
  } catch {
    return NextResponse.json({ error: "Failed to toggle connection" }, { status: 500 });
  }
}
