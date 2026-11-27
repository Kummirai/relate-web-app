import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { withCpuTiming } from "@/lib/api-timing";

async function handlePost(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user || !ObjectId.isValid(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const token = typeof data.token === "string" ? data.token.trim() : "";
    if (!token || token.length > 500) {
      return NextResponse.json({ error: "Push token is required" }, { status: 400 });
    }
    const deviceId = typeof data.deviceId === "string" ? data.deviceId.trim().slice(0, 64) : "";

    const db = await getDb();
    await db.collection("push_tokens").updateOne(
      { userId: user.id, token },
      {
        $set: {
          userId: user.id,
          token,
          platform: typeof data.platform === "string" ? data.platform : "unknown",
          ...(deviceId ? { deviceId } : {}),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
    if (deviceId) {
      // A device holds one account at a time: clear the device marker from
      // rows still filed under a previous account so they don't exempt it.
      await db.collection("push_tokens").updateMany(
        { token, userId: { $ne: user.id } },
        { $set: { deviceId: null } },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to register push token" }, { status: 500 });
  }
}

export const POST = withCpuTiming("push-tokens.POST", handlePost);
