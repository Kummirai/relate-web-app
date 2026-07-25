import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ disabled: [], custom: [], sounds: {} });
    const db = await getDb();
    const doc = await db.collection("user_prayer_preferences").findOne({ userId: user.id });
    return NextResponse.json({
      disabled: doc?.disabled || [],
      custom: doc?.custom || [],
      sounds: doc?.sounds || {},
    });
  } catch {
    return NextResponse.json({ disabled: [], custom: [], sounds: {} });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const db = await getDb();
    const update: Record<string, any> = { updatedAt: new Date() };
    if (body.disabled !== undefined) update.disabled = body.disabled;
    if (body.custom !== undefined) update.custom = body.custom;
    if (body.sounds !== undefined) update.sounds = body.sounds;
    await db.collection("user_prayer_preferences").updateOne(
      { userId: user.id },
      { $set: update },
      { upsert: true },
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
