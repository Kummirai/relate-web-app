import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ensurePublicationIndexes } from "@/lib/models";
import { normalizePublication } from "@/lib/season";
import { requireAdmin } from "@/lib/community-auth";

/**
 * Admin publications API.
 * GET  /api/admin/publications  — list all publications, drafts included
 * POST /api/admin/publications  — create a new publication (draft by default)
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim();
    const club = searchParams.get("club")?.trim();

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (club) {
      if (club === "relate") {
        query.clubSlug = { $exists: false };
      } else if (club === "any") {
        // no-op — any club
      } else {
        query.clubSlug = club;
      }
    }

    const db = await getDb();
    await ensurePublicationIndexes();
    const col = db.collection("publications");

    if (searchParams.get("countOnly") === "1") {
      const count = await col.countDocuments(query);
      return NextResponse.json({ count });
    }

    const items = await col
      .find(query)
      .sort({ updatedAt: -1 })
      .project({ weeks: 0, intro: 0 })
      .toArray();
    return NextResponse.json({ data: items });
  } catch {
    return NextResponse.json({ error: "Failed to fetch publications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
const payload = await request.json();
    const normalized = normalizePublication(payload);
    if ("error" in normalized) return NextResponse.json({ error: normalized.error }, { status: 400 });
    const doc = normalized.doc;

    const db = await getDb();
    await ensurePublicationIndexes();
    const existing = await db.collection("publications").findOne({ id: doc.id });
    if (existing) {
      return NextResponse.json(
        { error: `"${doc.id}" already exists. Edit it instead, or choose another id.` },
        { status: 409 },
      );
    }

    await db.collection("publications").insertOne(doc);
    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create publication" }, { status: 500 });
  }
}