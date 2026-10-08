import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin, resolveSession } from "@/lib/community-auth";
import { ensureOrderIndexes, serializeOrder } from "@/lib/orders";

/**
 * A single order — receipt, banking details and progress timeline.
 *
 *   GET /api/orders/[id]   The buyer who placed it, or an admin.
 *
 * The id is either the Mongo `_id` or the human-facing order number
 * (`RW-2026-0001`), so a receipt link works either way.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    await ensureOrderIndexes(db);
    const col = db.collection("orders");

    let doc = null as any;
    if (ObjectId.isValid(id)) doc = await col.findOne({ _id: new ObjectId(id) });
    if (!doc) doc = await col.findOne({ orderNumber: id });
    if (!doc) doc = await col.findOne({ _id: id });

    if (!doc) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const session = await resolveSession(request);
    const admin = await requireAdmin(request);
    const isOwner = !!session && doc.userId === session.id;
    if (!admin && !isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ data: serializeOrder(doc) });
  } catch {
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}
