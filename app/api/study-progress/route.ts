import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin, resolveSession } from "@/lib/community-auth";

/**
 * Study progress.
 *
 * Progress is personal, so the caller must be signed in and may only touch their
 * own rows. Admins may read another member's progress via ?userId=.
 */

export async function GET(request: NextRequest) {
  try {
    const session = await resolveSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requested = request.nextUrl.searchParams.get("userId");
    let userId = session.id;
    if (requested && requested !== session.id) {
      const admin = await requireAdmin(request);
      if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      userId = requested;
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
    const session = await resolveSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const data = await request.json();
    const { slug, title, completedLessons, totalLessons } = data;

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    // Writes always land on the caller's own row, whatever userId was sent.
    const userId = session.id;

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
          $setOnInsert: {
            userId,
            slug,
            title,
            startedAt: new Date(),
          },
        },
        { upsert: true },
      );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
