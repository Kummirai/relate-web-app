import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import {
  ensureOrderIndexes,
  isOrderStatus,
  serializeOrder,
} from "@/lib/orders";

/**
 * Order queue for the admin web app.
 *
 *   GET /api/admin/orders               All orders, newest first.
 *   GET /api/admin/orders?status=received  Filter by fulfilment status.
 *   GET /api/admin/orders?countOnly=1   Just the matching count (nav badge).
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const filter: Record<string, unknown> = {};
    if (status && status !== "all" && isOrderStatus(status)) filter.status = status;

    const db = await getDb();
    await ensureOrderIndexes(db);
    const col = db.collection("orders");

    if (searchParams.get("countOnly") === "1") {
      const count = await col.countDocuments(filter);
      return NextResponse.json({ count });
    }

    const docs = await col
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(300)
      .toArray();

    return NextResponse.json({ data: docs.map(serializeOrder) });
  } catch {
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
