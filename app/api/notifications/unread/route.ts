import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";

/** Lightweight unread-only count for the bell badge — avoids shipping the full list. */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user || !ObjectId.isValid(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const unread = await db
      .collection("notifications")
      .countDocuments({ userId: user.id, read: false });

    return NextResponse.json({ unread });
  } catch {
    return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 });
  }
}
