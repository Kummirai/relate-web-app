import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/community-auth";
import {
  createMovement,
  listMovements,
  movementDate,
  parseSeason,
} from "@/lib/school-kit";

/**
 * Stock ledger.
 *
 *   GET  /api/admin/school-kit/movements?season=&limit=  Recent rows, newest first.
 *   POST /api/admin/school-kit/movements                 Opening stock, restock
 *        (with Rand amount) or a stock-take adjustment. Issues come through
 *        /allocations instead.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const season = parseSeason(searchParams.get("season"));
    const limit = Number(searchParams.get("limit") ?? 80) || 80;
    return NextResponse.json({ data: await listMovements(season, limit) });
  } catch {
    return NextResponse.json({ error: "Failed to load stock movements" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "A movement payload is required." }, { status: 400 });
    }

    const result = await createMovement({
      kind: body.kind,
      item: body.item,
      qty: body.qty,
      amount: body.amount,
      date: body.date,
      note: body.note,
      adminId: admin.id,
      adminName: admin.name ?? "Admin",
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const date = movementDate(body.date);
    return NextResponse.json({
      success: true,
      data: { stock: result.stock, movements: await listMovements(date.getFullYear()) },
    });
  } catch {
    return NextResponse.json({ error: "Failed to record the stock movement" }, { status: 500 });
  }
}