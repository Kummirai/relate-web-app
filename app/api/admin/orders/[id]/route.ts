import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import {
  ensureOrderIndexes,
  isOrderStatus,
  serializeOrder,
} from "@/lib/orders";

/**
 * Update an order's fulfilment state.
 *
 *   PATCH /api/admin/orders/[id]
 *   body  { status?: OrderStatus, eta?: "YYYY-MM-DD", note?: string }
 *
 * Every status change is appended to `statusHistory`, which is what the
 * mobile progress timeline renders.
 */

async function findOrder(col: any, id: string) {
  if (ObjectId.isValid(id)) {
    const byId = await col.findOne({ _id: new ObjectId(id) });
    if (byId) return byId;
  }
  const byNumber = await col.findOne({ orderNumber: id });
  if (byNumber) return byNumber;
  return col.findOne({ _id: id });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const db = await getDb();
    await ensureOrderIndexes(db);
    const col = db.collection("orders");
    const existing = await findOrder(col, id);
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const set: Record<string, unknown> = { updatedAt: new Date() };
    const now = new Date().toISOString();
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) : "";

    if (body.status !== undefined) {
      if (!isOrderStatus(body.status)) {
        return NextResponse.json({ error: "Unknown status" }, { status: 400 });
      }
      const changed = existing.status !== body.status;
      set.status = body.status;
      if (changed) {
        const history = Array.isArray(existing.statusHistory)
          ? existing.statusHistory.slice()
          : [];
        history.push(
          note ? { status: body.status, at: now, note } : { status: body.status, at: now },
        );
        set.statusHistory = history;
      }
    }

    if (body.eta !== undefined) {
      const eta = typeof body.eta === "string" ? body.eta.trim() : "";
      if (eta && !/^\d{4}-\d{2}-\d{2}$/.test(eta)) {
        return NextResponse.json(
          { error: "ETA must be a date like 2026-10-14" },
          { status: 400 },
        );
      }
      set.eta = eta || null;
    }

    await col.updateOne({ _id: existing._id }, { $set: set });
    const saved = await col.findOne({ _id: existing._id });
    return NextResponse.json({ data: serializeOrder(saved) });
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
