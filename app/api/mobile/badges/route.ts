import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { withCpuTiming } from "@/lib/api-timing";
import { getHelpUnreadCounts, getNotificationUnreadCount } from "@/lib/unread";

type BadgeData = {
  userUnread: number;
  adminUnread: number;
  unread: number;
};

const badgeCache = new Map<string, { data: BadgeData; ts: number }>();
const BADGE_TTL = 30_000;

async function handleGet(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user || !ObjectId.isValid(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cached = badgeCache.get(user.id);
    if (cached && Date.now() - cached.ts < BADGE_TTL) {
      return NextResponse.json({ data: cached.data });
    }

    const db = await getDb();
    const userRecord = await db
      .collection("user")
      .findOne({ _id: new ObjectId(user.id) });
    const isAdmin = userRecord?.role === "admin";
    const [help, unread] = await Promise.all([
      getHelpUnreadCounts(db, user.id, isAdmin),
      getNotificationUnreadCount(db, user.id),
    ]);
    const data: BadgeData = { ...help, unread };
    badgeCache.set(user.id, { data, ts: Date.now() });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
  }
}

export const GET = withCpuTiming("mobile/badges.GET", handleGet);
