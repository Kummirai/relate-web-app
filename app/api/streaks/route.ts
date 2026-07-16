import { NextRequest, NextResponse } from "next/server";
import { resolveUser } from "@/lib/community-auth";
import { getDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUser(request);
    if (!userId) {
      return NextResponse.json({ data: {} });
    }
    const db = await getDb();
    const doc = await db.collection("user_streaks").findOne({ userId });
    return NextResponse.json({ data: doc?.streaks || {} });
  } catch {
    return NextResponse.json({ data: {} });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await resolveUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { streaks } = await request.json();
    if (!streaks || typeof streaks !== "object") {
      return NextResponse.json({ error: "streaks object required" }, { status: 400 });
    }
    const db = await getDb();
    await db.collection("user_streaks").updateOne(
      { userId },
      { $set: { streaks, updatedAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save streaks" }, { status: 500 });
  }
}
