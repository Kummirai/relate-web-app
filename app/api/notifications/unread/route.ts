import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { withCpuTiming } from "@/lib/api-timing";
import { getNotificationUnreadCount } from "@/lib/unread";

// Per-user cache for unread count (30s TTL).
const unreadCache = new Map<string, { count: number; ts: number }>();
const UNREAD_TTL = 30_000; // 30 seconds

/** Lightweight unread-only count for the bell badge — avoids shipping the full list. */
async function handleGet(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user || !ObjectId.isValid(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cached = unreadCache.get(user.id);
    if (cached && Date.now() - cached.ts < UNREAD_TTL) {
      return NextResponse.json({ unread: cached.count });
    }

    const db = await getDb();
    const unread = await getNotificationUnreadCount(db, user.id);

    unreadCache.set(user.id, { count: unread, ts: Date.now() });

    return NextResponse.json({ unread });
  } catch {
    return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 });
  }
}

export const GET = withCpuTiming("notifications/unread.GET", handleGet);
