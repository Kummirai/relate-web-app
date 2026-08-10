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

    const skill = await db.collection("community_skills").findOne({ _id: new ObjectId(id) });
    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    const access = await resolveAdminOrOwner(request, {
      userId: skill.userId,
      author: skill.author,
    });
    if (!access) {
      return NextResponse.json(
        { error: "Only the skill owner or an admin can view connections" },
        { status: 403 },
      );
    }

    const connections = await db
      .collection("community_skill_connections")
      .find({ skillId: id })
      .sort({ createdAt: -1 })
      .toArray();
    const userIds = connections.map((c: any) => c.userId);
    const participants = await fetchParticipants(db, userIds);
    const connByUser = new Map<string, any>(
      connections.filter((c: any) => c.userId).map((c: any) => [c.userId, c]),
    );

    const data = userIds.map((uid: string) => {
      const base = participants.get(uid);
      const conn = connByUser.get(uid);
      return {
        id: uid,
        name: base?.name || "Anonymous",
        email: base?.email || "",
        image: base?.image || null,
        connectedAt: conn?.createdAt || null,
      };
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
