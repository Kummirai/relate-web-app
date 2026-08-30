import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";

// Per-user cache for unread counts (30s TTL). Avoids running the
// aggregation pipeline on every push receipt / app resume.
const unreadCache = new Map<string, { data: { userUnread: number; adminUnread: number }; ts: number }>();
const UNREAD_TTL = 30_000; // 30 seconds

/** Time of the newest message of the given sender, or null if there is none. */
function lastMessageAt(sender: "user" | "admin") {
  return {
    $let: {
      vars: {
        msgs: {
          $filter: {
            input: { $ifNull: ["$messages", []] },
            as: "m",
            cond: { $eq: ["$$m.from", sender] },
          },
        },
      },
      in: { $arrayElemAt: ["$$msgs.createdAt", -1] },
    },
  };
}

export async function GET(request: NextRequest) {
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

    let userUnread = 0;
    let adminUnread = 0;

    if (isAdmin) {
      // New replies from users, plus open/in-progress requests that were never opened.
      // Note: in aggregation comparisons null sorts before dates, so
      // $gt [msgAt, readAt] also matches requests with no lastAdminReadAt — same
      // semantics as the old `new Date(lastAdminReadAt || 0)` check.
      const [row] = await db
        .collection("help_requests")
        .aggregate([
          {
            $project: {
              status: 1,
              lastAdminReadAt: 1,
              lastUserMsgAt: lastMessageAt("user"),
            },
          },
          {
            $match: {
              $or: [
                {
                  $and: [
                    { lastAdminReadAt: null },
                    { status: { $in: ["open", "in_progress"] } },
                  ],
                },
                { $expr: { $gt: ["$lastUserMsgAt", "$lastAdminReadAt"] } },
              ],
            },
          },
          { $count: "n" },
        ])
        .toArray();
      adminUnread = row?.n || 0;
    } else {
      const [row] = await db
        .collection("help_requests")
        .aggregate([
          { $match: { userId: user.id } },
          {
            $project: {
              lastUserReadAt: 1,
              lastAdminMsgAt: lastMessageAt("admin"),
            },
          },
          { $match: { $expr: { $gt: ["$lastAdminMsgAt", "$lastUserReadAt"] } } },
          { $count: "n" },
        ])
        .toArray();
      userUnread = row?.n || 0;
    }

    const data = { userUnread, adminUnread };
    unreadCache.set(user.id, { data, ts: Date.now() });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch unread counts" }, { status: 500 });
  }
}
