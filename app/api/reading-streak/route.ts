import { NextRequest, NextResponse } from "next/server";
import { resolveUser } from "@/lib/community-auth";
import { getDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUser(request);
    if (!userId) {
      return NextResponse.json({ data: [] });
    }
    const db = await getDb();
    const doc = await db.collection("reading_streaks").findOne({ userId });
    return NextResponse.json({ data: doc?.days || [] });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { days } = await request.json();
    if (!Array.isArray(days)) {
      return NextResponse.json({ error: "days array required" }, { status: 400 });
    }
    // Sanitize + dedupe: keep only well-formed YYYY-MM-DD date keys.
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    const clean = [
      ...new Set(
        days.filter((d): d is string => typeof d === "string" && DATE_RE.test(d)),
      ),
    ].slice(0, 5000);
    const db = await getDb();
    await db.collection("reading_streaks").updateOne(
      { userId },
      { $set: { days: clean, updatedAt: new Date() } },
      { upsert: true },
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save reading streak" }, { status: 500 });
  }
}
