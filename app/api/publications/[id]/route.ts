import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

/**
 * GET /api/publications/[id]
 * Public read of a single published publication by its stable `id` field
 * (e.g. "rooted-kids-oct-2026"), not its Mongo ObjectId.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const doc = await db
      .collection("publications")
      .findOne({ id, status: "published" });

    if (!doc) {
      return NextResponse.json(
        { error: "Publication not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(doc);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch publication" },
      { status: 500 },
    );
  }
}