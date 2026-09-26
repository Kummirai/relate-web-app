import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import {
  buildStoreItemDoc,
  ensureStoreIndexes,
  serializeStoreItem,
  slugifyStoreId,
} from "@/lib/store";

/**
 * Admin merch management.
 *
 *   GET    /api/admin/store              Every item, including inactive ones.
 *   GET    /api/admin/store?countOnly=1  Catalogue count.
 *   POST   /api/admin/store              Create an item.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const filter: Record<string, unknown> = {};
    if (category && category !== "all") filter.category = category;

    const db = await getDb();
    await ensureStoreIndexes(db);
    const col = db.collection("store_items");

    if (searchParams.get("countOnly") === "1") {
      const count = await col.countDocuments(filter);
      return NextResponse.json({ count });
    }

    const docs = await col.find(filter).sort({ createdAt: -1 }).limit(300).toArray();
    return NextResponse.json({ data: docs.map(serializeStoreItem) });
  } catch {
    return NextResponse.json({ error: "Failed to load merch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    let doc;
    try {
      doc = buildStoreItemDoc(data);
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "Invalid item" }, { status: 400 });
    }

    const db = await getDb();
    await ensureStoreIndexes(db);
    const col = db.collection("store_items");

    const baseId = slugifyStoreId(doc.name);
    let id = data.id ? String(data.id).trim() : baseId;
    // Keep ids unique so /store/[id] deep links stay unambiguous.
    if (!id || (await col.findOne({ id }))) {
      id = `${baseId}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const now = new Date();
    const result = await col.insertOne({ id, ...doc, createdAt: now, updatedAt: now });
    const saved = await col.findOne({ _id: result.insertedId });
    return NextResponse.json(serializeStoreItem(saved), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create merch" }, { status: 500 });
  }
}
