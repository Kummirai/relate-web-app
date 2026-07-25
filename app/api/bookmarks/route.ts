import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ data: [] });

    const db = await getDb();
    const bookmarks = await db
      .collection("user_bookmarks")
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    const idsBySection: Record<string, string[]> = {};
    for (const b of bookmarks) {
      if (!idsBySection[b.section]) idsBySection[b.section] = [];
      idsBySection[b.section].push(b.itemId);
    }

    const results: any[] = [];
    for (const [section, itemIds] of Object.entries(idsBySection)) {
      const collection = `community_${section === "requests" ? "requests" : section}`;
      const items = await db
        .collection(collection)
        .find({ _id: { $in: itemIds.map((id: string) => {
          try { return new (require("mongodb").ObjectId)(id); } catch { return id; }
        })}})
        .toArray();
      for (const item of items) {
        results.push({
          ...item,
          _id: item._id?.toString(),
          section,
          isBookmarked: true,
        });
      }
    }

    return NextResponse.json({ data: results });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { section, itemId } = await request.json();
    if (!section || !itemId) {
      return NextResponse.json({ error: "Missing section or itemId" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection("user_bookmarks").findOne({
      userId: user.id,
      section,
      itemId,
    });

    if (existing) {
      await db.collection("user_bookmarks").deleteOne({ _id: existing._id });
      return NextResponse.json({ data: { bookmarked: false } });
    }

    await db.collection("user_bookmarks").insertOne({
      userId: user.id,
      section,
      itemId,
      createdAt: new Date(),
    });
    return NextResponse.json({ data: { bookmarked: true } });
  } catch {
    return NextResponse.json({ error: "Failed to toggle bookmark" }, { status: 500 });
  }
}
