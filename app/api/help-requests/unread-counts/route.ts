import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { withCpuTiming } from "@/lib/api-timing";
import { getHelpUnreadCounts } from "@/lib/unread";

// Per-user cache for unread counts (30s TTL). Avoids running the
// aggregation pipeline on every push receipt / app resume.
const unreadCache = new Map<string, { data: { userUnread: number; adminUnread: number }; ts: number }>();
const UNREAD_TTL = 30_000; // 30 seconds

async function handleGet(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user || !ObjectId.isValid(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Serve from cache if fresh enough.
    const cached = unreadCache.get(user.id);
    if (cached && Date.now() - cached.ts < UNREAD_TTL) {
      return NextResponse.json({ data: cached.data });
    }

    const db = await getDb();
    const userRecord = await db
      .collection("user")
      .findOne({ _id: new ObjectId(user.id) });
    const isAdmin = userRecord?.role === "admin";
    const data = await getHelpUnreadCounts(db, user.id, isAdmin);
    unreadCache.set(user.id, { data, ts: Date.now() });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch unread counts" }, { status: 500 });
  }
}

export const GET = withCpuTiming("help-requests/unread-counts.GET", handleGet);
