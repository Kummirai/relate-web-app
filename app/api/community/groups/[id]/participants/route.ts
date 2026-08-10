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

    const group = await db.collection("community_groups").findOne({ _id: new ObjectId(id) });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const access = await resolveAdminOrOwner(request, {
      userId: group.userId,
      author: group.author,
    });
    if (!access) {
      return NextResponse.json(
        { error: "Only the group owner or an admin can view members" },
        { status: 403 },
      );
    }

    const userIds = group.joinedUserIds || [];
    const participants = await fetchParticipants(db, userIds);

    const data = userIds.map((uid: string) => {
      const base = participants.get(uid);
      return {
        id: uid,
        name: base?.name || "Anonymous",
        email: base?.email || "",
        image: base?.image || null,
      };
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
