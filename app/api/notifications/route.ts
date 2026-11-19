import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user || !ObjectId.isValid(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();

    // `scope=all` is the read-history page behind the All section; it is
    // fetched on demand and paged by createdAt. Default stays unread-only.
    if (request.nextUrl.searchParams.get("scope") === "all") {
      const limitRaw = parseInt(request.nextUrl.searchParams.get("limit") || "", 10);
      const limit = Math.min(Math.max(Number.isNaN(limitRaw) ? 20 : limitRaw, 1), 50);
      const beforeRaw = request.nextUrl.searchParams.get("before");
      const before = beforeRaw ? new Date(beforeRaw) : null;
      const filter: Record<string, unknown> = { userId: user.id };
      if (before && !Number.isNaN(before.getTime())) {
        filter.createdAt = { $lt: before };
      }
      const docs = await db
        .collection("notifications")
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .toArray();
      return NextResponse.json({
        data: docs.slice(0, limit),
        hasMore: docs.length > limit,
      });
    }

    // The inbox only shows what still needs attention; read history is not
    // fetched.
    const notifications = await db
      .collection("notifications")
      .find({ userId: user.id, read: false })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      data: notifications,
      unread: notifications.length,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user || !ObjectId.isValid(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    await db
      .collection("notifications")
      .updateMany({ userId: user.id, read: false }, { $set: { read: true } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
