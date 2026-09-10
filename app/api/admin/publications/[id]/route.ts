import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { normalizePublication } from "@/lib/season";
import { requireAdmin } from "@/lib/community-auth";

/**
 * Admin publication by stable id.
 * GET    /api/admin/publications/[id]  — full document (weeks included)
 * PUT    /api/admin/publications/[id]  — replace content
 * DELETE /api/admin/publications/[id]  — remove the publication
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(_request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const db = await getDb();
    const doc = await db.collection("publications").findOne({ id });
    if (!doc) return NextResponse.json({ error: "Publication not found" }, { status: 404 });
    return NextResponse.json({ data: doc });
  } catch {
    return NextResponse.json({ error: "Failed to fetch publication" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const payload = await request.json();
    const db = await getDb();
    const existing = await db.collection("publications").findOne({ id });
    if (!existing) return NextResponse.json({ error: "Publication not found" }, { status: 404 });

    const result = normalizePublication(
      { ...payload, id },
      existing as any,
    );
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    const doc = result.doc;

    // id is the stable key — never let an edit rename it.
    doc.id = id;
    await db
      .collection("publications")
      .updateOne({ id }, { $set: doc });
    return NextResponse.json({ success: true, data: doc });
  } catch {
    return NextResponse.json({ error: "Failed to update publication" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.collection("publications").deleteOne({ id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Publication not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete publication" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const status = body.status === "published" ? "published" : "draft";
    const db = await getDb();
    const existing = await db.collection("publications").findOne({ id });
    if (!existing) return NextResponse.json({ error: "Publication not found" }, { status: 404 });

    const set: Record<string, unknown> = { status, updatedAt: new Date() };
    if (status === "published") {
      set.publishedAt = existing.publishedAt || new Date();
    } else {
      set.publishedAt = null;
    }
    await db.collection("publications").updateOne({ id }, { $set: set });
    const updated = await db.collection("publications").findOne({ id });
    const data = {
      id: updated?.id,
      title: updated?.title,
      status: updated?.status,
      publishedAt: updated?.publishedAt,
      clubSlug: updated?.clubSlug || null,
    };
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}