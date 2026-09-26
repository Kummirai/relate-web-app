import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import { buildStoreItemDoc, ensureStoreIndexes, serializeStoreItem } from "@/lib/store";

/**
 * Single merch item.
 *
 *   GET    /api/store/[id]        Public — active items only.
 *   PATCH  /api/admin/store/[id]  Admin — partial update.
 *   DELETE /api/admin/store/[id]  Admin — remove.
 */

/** Accepts either the slug id or the Mongo _id. */
async function findItem(col: any, id: string) {
  const bySlug = await col.findOne({ id });
  if (bySlug) return bySlug;
  if (ObjectId.isValid(id)) {
    return col.findOne({ _id: new ObjectId(id) });
  }
  return null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    await ensureStoreIndexes(db);
    const doc = await findItem(db.collection("store_items"), id);
    if (!doc || doc.active === false) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json(serializeStoreItem(doc));
  } catch {
    return NextResponse.json({ error: "Failed to load item" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDb();
    await ensureStoreIndexes(db);
    const col = db.collection("store_items");
    const existing = await findItem(col, id);
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const data = await request.json();
    let doc;
    try {
      doc = buildStoreItemDoc(data, existing);
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "Invalid item" }, { status: 400 });
    }

    await col.updateOne({ _id: existing._id }, { $set: { ...doc, updatedAt: new Date() } });
    const saved = await col.findOne({ _id: existing._id });
    return NextResponse.json(serializeStoreItem(saved));
  } catch {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDb();
    await ensureStoreIndexes(db);
    const col = db.collection("store_items");
    const existing = await findItem(col, id);
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await col.deleteOne({ _id: existing._id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
