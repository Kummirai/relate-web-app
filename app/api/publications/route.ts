import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ensurePublicationIndexes } from "@/lib/models";

/**
 * GET /api/publications
 * Public list of published magazines & bulletins, newest first.
 * Optional ?club=sprout-kids filters to that club's bulletins and any
 * magazine carrying the matching club tag (mirrors the Library screen).
 */
export async function GET(request: NextRequest) {
  try {
    const club = new URL(request.url).searchParams.get("club");

    const db = await getDb();
    await ensurePublicationIndexes();

    const query: Record<string, unknown> = { status: "published" };
    if (club && club !== "relate") {
      const upper = club.toUpperCase();
      const or: Record<string, unknown>[] = [{ clubSlug: club }];
      or.push({ kind: "magazine", tags: upper });
      query.$or = or;
    } else if (!club) {
      // No club filter — all publications.
    }

    const items = await db
      .collection("publications")
      .find(query)
      .sort({ publishedAt: -1 })
      .project({ blocks: 0, weeks: 0 })
      .toArray();

    return NextResponse.json(items);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch publications" },
      { status: 500 },
    );
  }
}