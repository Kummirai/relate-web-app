import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ data: [] });
    }
    const db = await getDb();
    const progress = await db
      .collection("user_study_progress")
      .find({ userId })
      .sort({ startedAt: -1 })
      .toArray();
    return NextResponse.json({ data: progress });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const data = await request.json();
    const { userId, slug, title, completedLessons, totalLessons } = data;

    if (!userId || !slug) {
      return NextResponse.json({ error: "userId and slug are required" }, { status: 400 });
    }

    const existing = await db
      .collection("user_study_progress")
      .findOne({ userId, slug });

    if (existing) {
      await db
        .collection("user_study_progress")
        .updateOne(
          { userId, slug },
          {
            $set: {
              completedLessons,
              totalLessons,
              updatedAt: new Date(),
            },
          },
        );
    } else {
      const doc = {
        userId,
        slug,
        title,
        completedLessons,
        totalLessons,
        startedAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection("user_study_progress").insertOne(doc);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
