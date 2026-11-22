import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { withCpuTiming } from "@/lib/api-timing";
import {
  getUserWebPushSubscriptions,
  sendWebPushToSubscriptions,
} from "@/lib/push";

async function handlePost(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user || !ObjectId.isValid(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const subscriptions = await getUserWebPushSubscriptions(db, user.id);
    const sent = await sendWebPushToSubscriptions(
      subscriptions,
      "Test notification",
      "Web push is working on this device.",
      { route: "/", testPush: true },
    );
    return NextResponse.json({ success: true, sent });
  } catch {
    return NextResponse.json({ error: "Failed to send test notification" }, { status: 500 });
  }
}

export const POST = withCpuTiming("push-subscriptions/test.POST", handlePost);
