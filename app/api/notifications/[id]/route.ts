import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";

/**
 * POST /api/notifications/[id]
 *   → marks ONE notification as read (opening a single item must never
 *     clear the rest). Returns the caller's remaining unread count.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await resolveSession(request);
    if (!user || !ObjectId.isValid(user.id) || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    await db
      .collection("notifications")
      .updateOne({ _id: new ObjectId(id), userId: user.id }, { $set: { read: true } });

    const unread = await db
      .collection("notifications")
      .countDocuments({ userId: user.id, read: false });

    return NextResponse.json({ success: true, unread });
  } catch {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
