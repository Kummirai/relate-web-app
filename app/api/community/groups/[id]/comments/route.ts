import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  resolveSession,
  fetchParticipants,
  requireAdmin,
} from "@/lib/community-auth";
import { createNotification } from "@/lib/inapp-notify";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";

/**
 * Comments on a prayer group (Twitter-style replies of encouragement).
 * - GET  → the thread for a group, oldest first.
 * - POST → add a comment; the group owner is notified (in-app + push).
 * - DELETE → the comment author, group owner, or an admin can remove it.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ data: [] });
    }

    const user = await resolveSession(request);
    const comments = await db
      .collection("community_group_comments")
      .find({ groupId: id })
      .sort({ createdAt: 1 })
      .limit(200)
      .toArray();

    const userIds = comments.map((c: any) => c.userId).filter(Boolean);
    const participants = await fetchParticipants(db, userIds);

    const data = comments.map((c: any) => {
      const author = c.userId ? participants.get(c.userId) : null;
      return {
        _id: c._id,
        groupId: c.groupId,
        text: c.text,
        author: author?.name || "Anonymous",
        image: author?.image || null,
        mine: !!user && c.userId === user.id,
        createdAt: c.createdAt,
      };
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

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

    const group = await db.collection("community_groups").findOne({ _id: new ObjectId(id) });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const body = await request.json();
    const text = String(body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }
    if (text.length > 500) {
      return NextResponse.json({ error: "Comment is too long (max 500 chars)" }, { status: 400 });
    }

    const result = await db.collection("community_group_comments").insertOne({
      groupId: id,
      userId,
      text,
      createdAt: new Date(),
    });

    // Keep the group's comment count in sync for the list view.
    await db
      .collection("community_groups")
      .updateOne({ _id: new ObjectId(id) }, { $inc: { commentCount: 1 } });

    // Let the group owner know someone encouraged the group — but not if
    // they're commenting on their own group. Awaited for Vercel delivery.
    if (group.userId && group.userId !== userId) {
      try {
        const actorName = user?.name || "Someone";
        const title = "Encouragement on your prayer group";
        const body = `${actorName}: ${text.length > 80 ? `${text.slice(0, 80)}…` : text}`;
        const data = { tab: "spiritual", section: "groups", itemId: id };
        await Promise.all([
          createNotification(db, group.userId, {
            type: "group_comment",
            title,
            body,
            data,
          }),
          sendPushNotifications(
            await getUserPushTokens(db, group.userId),
            title,
            body,
            data,
          ),
        ]);
      } catch {}
    }

    return NextResponse.json(
      {
        data: {
          _id: result.insertedId,
          groupId: id,
          text,
          author: user?.name || "Anonymous",
          image: null,
          mine: true,
          createdAt: new Date(),
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}

/**
 * Deletes a comment. Allowed for the comment's author, the group's owner,
 * or an admin.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    let commentId = "";
    try {
      const body = await request.json();
      commentId = String(body?.commentId || "");
    } catch {
      // Body-less DELETE — commentId stays empty and fails validation below.
    }

    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!ObjectId.isValid(id) || !ObjectId.isValid(commentId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const comment = await db
      .collection("community_group_comments")
      .findOne({ _id: new ObjectId(commentId), groupId: id });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const isAdmin = !!(await requireAdmin(request));
    const isCommentAuthor = comment.userId === user.id;
    const group = await db.collection("community_groups").findOne({ _id: new ObjectId(id) });
    const isGroupOwner =
      group?.userId === user.id ||
      (!group?.userId && !!user.name && group?.author === user.name);

    if (!isAdmin && !isCommentAuthor && !isGroupOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.collection("community_group_comments").deleteOne({ _id: new ObjectId(commentId) });
    await db
      .collection("community_groups")
      .updateOne(
        { _id: new ObjectId(id) },
        { $inc: { commentCount: -1 } },
      );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
