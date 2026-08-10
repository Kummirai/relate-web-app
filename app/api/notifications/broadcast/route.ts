import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import { notifyAllUsers } from "@/lib/inapp-notify";
import { getAllPushTokens, sendPushNotifications } from "@/lib/push";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const data = await request.json();
    const title = typeof data.title === "string" ? data.title.trim().slice(0, 120) : "";
    const body = typeof data.body === "string" ? data.body.trim().slice(0, 500) : "";
    if (!title || !body) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 },
      );
    }

    // Fire-and-forget so the admin's response isn't blocked by slow fan-out.
    void (async () => {
      try {
        await Promise.all([
          notifyAllUsers(
            db,
            { type: "announcement", title, body },
            admin.id,
          ),
          sendPushNotifications(
            await getAllPushTokens(db, admin.id),
            title,
            body,
            { type: "announcement" },
          ),
        ]);
      } catch {}
    })();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send announcement" }, { status: 500 });
  }
}
