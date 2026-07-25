import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession, fetchParticipants } from "@/lib/community-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ data: [] });

    const db = await getDb();
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    const activities = await db
      .collection("user_activity")
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const actorIds = activities.map((a: any) => a.actorId).filter(Boolean);
    const actors = await fetchParticipants(db, actorIds);

    const data = activities.map((a: any) => ({
      _id: a._id?.toString(),
      type: a.type,
      section: a.section,
      itemId: a.itemId,
      itemTitle: a.itemTitle,
      actorName: actors.get(a.actorId)?.name || "Someone",
      actorEmail: actors.get(a.actorId)?.email || "",
      createdAt: a.createdAt,
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
