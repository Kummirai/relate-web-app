import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession, ensureIndexes, fetchParticipants } from "@/lib/community-auth";
import { notifyAllUsers, notifyAdmins } from "@/lib/inapp-notify";
import {
  getAllPushTokens,
  getAdminPushTokens,
  sendPushNotifications,
} from "@/lib/push";

/** Builds the notification body shown next to a prayer request. */
function requestBody(category?: string, anonymous?: boolean, author?: string) {
  return `${category || "Prayer request"}${anonymous ? "" : ` · ${author || "Anonymous"}`}`;
}

/**
 * Notifies the audience matching a request's visibility: community requests
 * reach every other user, team-only requests reach the prayer team (admins).
 * In-app + push, awaited so Vercel doesn't freeze delivery.
 */
async function notifyPrayerRequest(
  db: any,
  opts: {
    title: string;
    body: string;
    requestId: string;
    visibility: string;
    exceptUserId?: string | null;
  },
) {
  const { title, body, visibility, exceptUserId } = opts;
  const data = { section: "requests", requestId: opts.requestId };
  if ((visibility || "community") === "community") {
    await Promise.all([
      notifyAllUsers(db, { type: "prayer_request", title, body, data }, exceptUserId ?? null),
      sendPushNotifications(await getAllPushTokens(db, exceptUserId), title, body, data),
    ]);
  } else {
    await Promise.all([
      notifyAdmins(db, { type: "prayer_request", title, body, data }, exceptUserId ?? null),
      sendPushNotifications(await getAdminPushTokens(db, exceptUserId), title, body, data),
    ]);
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    await ensureIndexes(db);
    const user = await resolveSession(request);
    const userId = user?.id || null;

    const requests = await db
      .collection("community_requests")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const allUserIds = requests.flatMap((r: any) => r.prayedUserIds || []);
    const participants = await fetchParticipants(db, allUserIds);

    const data = requests.map((r: any) => {
      const prayedUsers = (r.prayedUserIds || [])
        .map((id: string) => participants.get(id))
        .filter(Boolean);
      const isOwner = userId
        ? r.userId === userId || (!r.userId && !!user.name && r.author === user.name)
        : false;
      return {
        _id: r._id,
        title: r.title || r.text,
        text: r.text,
        description: r.description || r.text,
        author: r.author,
        userId: r.userId || null,
        category: r.category || "",
        anonymous: !!r.anonymous,
        visibility: r.visibility || "community",
        // Email is private — only the owner can read it back.
        email: isOwner ? r.email || "" : undefined,
        prayCount: r.prayCount || 0,
        prayedByMe: userId ? (r.prayedUserIds || []).includes(userId) : false,
        prayedUsers,
        isOwner,
        createdAt: r.createdAt,
      };
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await resolveSession(request);
    const userId = user?.id || null;
    const data = await request.json();
    const doc = {
      title: data.title || data.category || "",
      text: data.text || "",
      description: data.description || "",
      author: data.anonymous ? "Anonymous" : data.author || "Anonymous",
      category: data.category || "",
      anonymous: !!data.anonymous,
      visibility: data.visibility || "community",
      email: data.email || "",
      userId: userId || null,
      prayCount: 0,
      prayedUserIds: [],
      createdAt: new Date(),
    };
    const result = await db.collection("community_requests").insertOne(doc);

    // Notifications follow the visibility the requester chose: a community
    // request is broadcast to every other user so the whole community can
    // stand with the person who asked, while a team-only request goes to the
    // prayer team (admins) instead.
    await notifyPrayerRequest(db, {
      title: "New prayer request",
      body: requestBody(doc.category, doc.anonymous, doc.author),
      requestId: result.insertedId?.toString() || "",
      visibility: doc.visibility || "community",
      exceptUserId: userId,
    });

    return NextResponse.json(
      { data: { _id: result.insertedId, ...doc, prayedByMe: false, isOwner: !!userId } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;
    const userName = user.name;

    const { _id, ...updateData } = await request.json();
    if (!ObjectId.isValid(_id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await db.collection("community_requests").findOne({ _id: new ObjectId(_id) });
    if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const canEdit = existing.userId === userId || (!existing.userId && !!userName && existing.author === userName);
    if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const setFields: Record<string, any> = { updatedAt: new Date() };
    if (updateData.title !== undefined) setFields.title = updateData.title;
    if (updateData.text !== undefined) setFields.text = updateData.text;
    if (updateData.description !== undefined) setFields.description = updateData.description;
    if (updateData.category !== undefined) setFields.category = updateData.category;
    if (updateData.anonymous !== undefined) setFields.anonymous = !!updateData.anonymous;
    if (updateData.visibility !== undefined) setFields.visibility = updateData.visibility;
    if (updateData.email !== undefined) setFields.email = updateData.email;
    if (updateData.author !== undefined) setFields.author = updateData.anonymous ? "Anonymous" : updateData.author;

    await db.collection("community_requests").updateOne(
      { _id: new ObjectId(_id) },
      { $set: setFields },
    );

    const updated = await db.collection("community_requests").findOne({ _id: new ObjectId(_id) });

    // Keep the community / prayer team in the loop when a shared request is
    // edited — but only if something publicly visible actually changed.
    // Email is private (only the owner can read it back), so edits that touch
    // just the email (or are no-ops) stay quiet.
    const publicFields = [
      "title",
      "text",
      "description",
      "category",
      "anonymous",
      "visibility",
      "author",
    ] as const;
    const changedPublicly = publicFields.some(
      (f) => setFields[f] !== undefined && setFields[f] !== existing[f],
    );
    if (changedPublicly) {
      await notifyPrayerRequest(db, {
        title: "Prayer request updated",
        body: requestBody(updated?.category, updated?.anonymous, updated?.author),
        requestId: _id,
        visibility: updated?.visibility || "community",
        exceptUserId: userId,
      });
    }

    return NextResponse.json({ data: { ...updated, isOwner: true } });
  } catch {
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;
    const userName = user.name;

    const { _id } = await request.json();
    if (!ObjectId.isValid(_id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await db.collection("community_requests").findOne({ _id: new ObjectId(_id) });
    if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const canDelete = existing.userId === userId || (!existing.userId && !!userName && existing.author === userName);
    if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.collection("community_requests").deleteOne({ _id: new ObjectId(_id) });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete request" }, { status: 500 });
  }
}
