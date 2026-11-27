import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { withCpuTiming } from "@/lib/api-timing";
import { WEB_PUSH_COLLECTION } from "@/lib/push";
import { planReminderQueueForUser } from "@/lib/reminder-schedule";

async function handlePost(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user || !ObjectId.isValid(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const subscription = body?.subscription;
    const endpoint = typeof subscription?.endpoint === "string" ? subscription.endpoint.trim() : "";
    const p256dh = typeof subscription?.keys?.p256dh === "string" ? subscription.keys.p256dh.trim() : "";
    const auth = typeof subscription?.keys?.auth === "string" ? subscription.keys.auth.trim() : "";
    if (!/^https?:\/\//i.test(endpoint) || endpoint.length > 2048 || !p256dh || !auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }
    const deviceId = typeof body?.deviceId === "string" ? body.deviceId.trim().slice(0, 64) : "";

    const db = await getDb();
    const result = await db.collection(WEB_PUSH_COLLECTION).updateOne(
      { userId: user.id, endpoint },
      {
        $set: {
          userId: user.id,
          endpoint,
          keys: { p256dh, auth },
          ...(deviceId ? { deviceId } : {}),
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
    if (deviceId) {
      // A browser holds one account at a time: clear the device marker from
      // rows still filed under a previous account so they don't exempt it.
      await db.collection(WEB_PUSH_COLLECTION).updateMany(
        { endpoint, userId: { $ne: user.id } },
        { $set: { deviceId: null } },
      );
    }
    if (result.upsertedCount) {
      // First subscription for this browser: queue its reminders now instead
      // of waiting for the next 12-hour plan run.
      try {
        await planReminderQueueForUser(user.id, request.nextUrl.origin, new Date());
      } catch (error) {
        console.error("[push/plan] new subscription plan failed", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to register push subscription" }, { status: 500 });
  }
}

async function handleDelete(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user || !ObjectId.isValid(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const endpoint = typeof body?.endpoint === "string" ? body.endpoint.trim() : "";
    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint is required" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection(WEB_PUSH_COLLECTION).deleteMany({ userId: user.id, endpoint });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove push subscription" }, { status: 500 });
  }
}

export const POST = withCpuTiming("push-subscriptions.POST", handlePost);
export const DELETE = withCpuTiming("push-subscriptions.DELETE", handleDelete);
