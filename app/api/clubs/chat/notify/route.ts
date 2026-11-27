import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { getPushTokensByUserIds, sendPushMessages } from "@/lib/push";

const CLUB_JOIN_COL = "club_join_applications";
const NOTIFIED_COL = "club_chat_notified";

const SPROUT_SLUGS = ["sprout", "sprout-kids", "sprout-tweens", "sprout-teens"];

function clubFilter(slug: string) {
  return SPROUT_SLUGS.includes(slug)
    ? { clubSlug: { $in: SPROUT_SLUGS } }
    : { clubSlug: slug };
}

/**
 * POST /api/clubs/chat/notify
 *
 * Pushes a new club chat message to that club's active members (sender
 * excluded, muted members excluded). Two callers are accepted:
 *
 *  - Supabase Database Webhook on club_chat_messages INSERTs, authorised by
 *    CLUB_CHAT_WEBHOOK_SECRET in the x-webhook-secret header.
 *  - The mobile app itself right after a successful send, authorised by the
 *    sender's session — the sender must be an active member of the club.
 *
 * Both paths can be active at once: the message id is claimed in
 * club_chat_notified first, so the second caller is a no-op instead of a
 * duplicate push.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as {
      record?: Record<string, unknown>;
    } | null;
    const record = payload?.record;
    if (!record) return NextResponse.json({ ok: true });

    const slug = String(record.club_slug ?? "").trim().toLowerCase();
    const senderId = String(record.sender_id ?? "");
    const senderName = String(record.sender_name ?? "").trim() || "A member";
    const text = String(record.body ?? "").trim();
    const hasImage =
      typeof record.image_url === "string" && record.image_url.length > 0;
    if (!slug || (!text && !hasImage)) return NextResponse.json({ ok: true });

    // Webhook callers prove themselves with the shared secret; the app sends
    // the sender's session cookie instead and may only notify for its own
    // messages from a club it belongs to.
    const secret = process.env.CLUB_CHAT_WEBHOOK_SECRET || "";
    const headerSecret = request.headers.get("x-webhook-secret");
    const fromWebhook = headerSecret !== null;
    if (fromWebhook) {
      if (!secret) {
        return NextResponse.json({ error: "Not configured" }, { status: 503 });
      }
      if (headerSecret !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const db = await getDb();

    if (!fromWebhook) {
      const user = await resolveSession(request);
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (!senderId || senderId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const membership = await db.collection(CLUB_JOIN_COL).findOne({
        ...clubFilter(slug),
        status: "active",
        userId: senderId,
      });
      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const messageId = String(record.id ?? "").trim();
    // The install that sent the message must never be notified about it — not
    // even through a subscription still filed under another account (account
    // switch on the same device). The client supplies this id with its session.
    const senderDeviceId =
      typeof record.device_id === "string" ? record.device_id.trim().slice(0, 64) : "";

    const rows = await db
      .collection(CLUB_JOIN_COL)
      .find({ ...clubFilter(slug), status: "active" })
      .project({ userId: 1 })
      .limit(500)
      .toArray();
    const userIds = rows
      .map((row: any) => String(row.userId ?? ""))
      .filter((id: string) => id && id !== senderId);
    if (!userIds.length) return NextResponse.json({ ok: true });

    const validObjectIds = userIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const [club, tokensByUser, users] = await Promise.all([
      db.collection("clubs").findOne({ slug }, { projection: { name: 1 } }),
      getPushTokensByUserIds(db, userIds, senderDeviceId || undefined),
      db
        .collection("user")
        .find(
          {
            $or: [
              { id: { $in: userIds } },
              ...(validObjectIds.length ? [{ _id: { $in: validObjectIds } }] : []),
            ],
          },
          { projection: { id: 1, mutedClubChats: 1 } },
        )
        .toArray(),
    ]);

    // Members who muted this club's chat stay silent — no banner, no sound.
    // Sprout members mute under the shared "sprout" key whichever Sprout
    // group they are in, so the alias is checked too.
    const muteSlugs = new Set([slug, ...(SPROUT_SLUGS.includes(slug) ? ["sprout"] : [])]);
    const mutedIds = new Set(
      users
        .filter(
          (u: any) =>
            Array.isArray(u.mutedClubChats) &&
            u.mutedClubChats.some((m: string) => muteSlugs.has(m)),
        )
        .map((u: any) => String(u.id ?? u._id)),
    );
    const targets = userIds
      .filter((userId) => !mutedIds.has(userId))
      .flatMap((userId) =>
        (tokensByUser.get(userId) || []).map((to) => ({ userId, to })),
      );
    if (!targets.length) return NextResponse.json({ ok: true });

    if (messageId) {
      try {
        await db
          .collection(NOTIFIED_COL)
          .insertOne({ _id: messageId, slug, notifiedAt: new Date() });
      } catch (err: any) {
        if (err?.code === 11000) return NextResponse.json({ ok: true, duplicate: true });
        throw err;
      }
    }

    const clubName = String(club?.name ?? "Club chat");
    const preview = text
      ? text.length > 120
        ? `${text.slice(0, 117)}…`
        : text
      : "Sent a photo";

    await sendPushMessages(
      targets.map(({ to }) => ({
        to,
        title: clubName,
        body: `${senderName}: ${preview}`,
        data: { route: "/club-chat", clubSlug: slug },
      })),
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[club-chat/notify] failed", e);
    return NextResponse.json({ error: "Notify failed" }, { status: 500 });
  }
}
