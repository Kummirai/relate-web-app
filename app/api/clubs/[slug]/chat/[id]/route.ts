import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveAdminOrOwner } from "@/lib/community-auth";

// -----------------------------------------------------------------------
// DELETE /api/clubs/[slug]/chat/[id]
// Owner (message author) or admin may delete a chat message.
// -----------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid message id" }, { status: 400 });
    }

    const db = await getDb();
    const doc = await db
      .collection("club_chat_messages")
      .findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const role = await resolveAdminOrOwner(request, { userId: doc.userId });
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.collection("club_chat_messages").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[clubs/chat/[id]] DELETE error:", e);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 },
    );
  }
}
