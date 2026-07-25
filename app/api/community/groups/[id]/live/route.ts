import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const group = await db.collection("community_groups").findOne({ _id: new ObjectId(id) });
    if (!group)
      return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const hasJoined = (group.joinedUserIds || []).includes(user.id);
    const isOwner = group.userId === user.id;
    if (!hasJoined && !isOwner)
      return NextResponse.json({ error: "Must join group first" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const action = body.action as "start" | "stop";

    if (action === "stop" || group.liveSessionId) {
      await db.collection("community_groups").updateOne(
        { _id: new ObjectId(id) },
        { $set: { liveSessionId: null, liveSessionStartedBy: null } },
      );
      return NextResponse.json({ data: { liveSessionId: null } });
    }

    const roomId = `relate-group-${id}-${Date.now()}`;
    await db.collection("community_groups").updateOne(
      { _id: new ObjectId(id) },
      { $set: { liveSessionId: roomId, liveSessionStartedBy: user.id } },
    );

    return NextResponse.json({ data: { liveSessionId: roomId } });
  } catch {
    return NextResponse.json(
      { error: "Failed to toggle live session" },
      { status: 500 },
    );
  }
}
