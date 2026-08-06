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
    const userRecord = await db
      .collection("user")
      .findOne({ _id: new ObjectId(user.id) });
    const isAdmin = userRecord?.role === "admin";

    let userUnread = 0;
    let adminUnread = 0;

    if (isAdmin) {
      const requests = await db
        .collection("help_requests")
        .find({})
        .project({ messages: 1, lastAdminReadAt: 1, status: 1 })
        .toArray();
      adminUnread = requests.filter((r: any) => {
        const msgs = r.messages || [];
        const hasNewUserMsg = msgs.some(
          (m: any) =>
            m.from === "user" &&
            new Date(m.createdAt) > new Date(r.lastAdminReadAt || 0),
        );
        const neverOpened =
          !r.lastAdminReadAt && (r.status === "open" || r.status === "in_progress");
        return hasNewUserMsg || neverOpened;
      }).length;
    } else {
      const requests = await db
        .collection("help_requests")
        .find({ userId: user.id })
        .project({ messages: 1, lastUserReadAt: 1 })
        .toArray();
      userUnread = requests.filter((r: any) =>
        (r.messages || []).some(
          (m: any) =>
            m.from === "admin" &&
            new Date(m.createdAt) > new Date(r.lastUserReadAt || 0),
        ),
      ).length;
    }

    return NextResponse.json({ data: { userUnread, adminUnread } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch unread counts" }, { status: 500 });
  }
}
