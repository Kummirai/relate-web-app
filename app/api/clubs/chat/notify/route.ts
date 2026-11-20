import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sendPushMessages } from "@/lib/push";

const CLUB_JOIN_COL = "club_join_applications";

const SPROUT_SLUGS = ["sprout", "sprout-kids", "sprout-tweens", "sprout-teens"];

/**
 * POST /api/clubs/chat/notify
 *
 * Supabase Database Webhook target for INSERTs on club_chat_messages. Pushes
 * the new message to the club's active members (sender excluded). The caller
 * must present CLUB_CHAT_WEBHOOK_SECRET in the x-webhook-secret header.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.CLUB_CHAT_WEBHOOK_SECRET || "";
    if (!secret) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }
    if (request.headers.get("x-webhook-secret") !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const db = await getDb();
    const filter =
      slug === "sprout"
        ? { status: "active", clubSlug: { $in: SPROUT_SLUGS } }
        : { status: "active", clubSlug: slug };

    const rows = await db
      .collection(CLUB_JOIN_COL)
      .find(filter)
      .project({ userId: 1 })
      .limit(500)
      .toArray();
    const userIds = rows
      .map((row: any) => String(row.userId ?? ""))
      .filter((id: string) => id && id !== senderId);
    if (!userIds.length) return NextResponse.json({ ok: true });

    const [club, tokens] = await Promise.all([
      db.collection("clubs").findOne({ slug }, { projection: { name: 1 } }),
      db
        .collection("push_tokens")
        .find({ userId: { $in: userIds } })
        .toArray(),
    ]);
    const clubName = String(club?.name ?? "Club chat");
    const preview = text
      ? text.length > 120
        ? `${text.slice(0, 117)}…`
        : text
      : "Sent a photo";

    await sendPushMessages(
      tokens
        .map((t: any) => String(t.token ?? ""))
        .filter(Boolean)
        .map((to: string) => ({
          to,
          title: clubName,
          body: `${senderName}: ${preview}`,
          data: { route: "/club-chat" },
        })),
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[club-chat/notify] failed", e);
    return NextResponse.json({ error: "Notify failed" }, { status: 500 });
  }
}
