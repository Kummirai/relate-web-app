import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import { normalizePlanInput } from "@/lib/reading-plans-admin";

/**
 * Admin reading plan by slug (the stable key).
 * GET    /api/admin/reading-plans/[slug]  — full document incl. drafts
 * PUT    /api/admin/reading-plans/[slug]  — upsert (create or update)
 * DELETE /api/admin/reading-plans/[slug]  — remove an authored plan
 *
 * Catalog plans have no document until first saved; PUT creates it, which is
 * how editing a static catalog plan "authors" an override.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { slug } = await params;
    const db = await getDb();
    const doc = await db.collection("reading_plans").findOne({ slug });
    if (!doc) return NextResponse.json({ error: "Reading plan not found" }, { status: 404 });
    return NextResponse.json({ data: doc });
  } catch {
    return NextResponse.json({ error: "Failed to fetch reading plan" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { slug } = await params;
    const payload = await request.json();
    const normalized = normalizePlanInput(slug, payload);
    if ("error" in normalized) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection("reading_plans");
    await col.updateOne(
      { slug },
      {
        $set: { ...normalized.doc, slug, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
    const doc = await col.findOne({ slug });
    return NextResponse.json({ success: true, data: doc });
  } catch {
    return NextResponse.json({ error: "Failed to save reading plan" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { slug } = await params;
    const db = await getDb();
    const result = await db.collection("reading_plans").deleteOne({ slug });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Catalog plans can't be deleted — only saved (authored) plans can." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete reading plan" }, { status: 500 });
  }
}
