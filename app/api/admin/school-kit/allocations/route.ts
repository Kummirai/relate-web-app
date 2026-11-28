import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/community-auth";
import { createAllocation, listMovements, movementDate } from "@/lib/school-kit";

/**
 * POST /api/admin/school-kit/allocations
 *   { memberIds: string[], items: [{ item, qty }], date?, swapVerified?, note? }
 *
 * Writes one issue row per learner per item, so stock deducts itself. The
 * whole request is refused when any item would go negative.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "An allocation payload is required." }, { status: 400 });
    }

    const result = await createAllocation({
      memberIds: body.memberIds,
      items: body.items,
      swapVerified: body.swapVerified === true,
      date: body.date,
      note: body.note,
      adminId: admin.id,
      adminName: admin.name ?? "Admin",
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const year = movementDate(body.date).getFullYear();
    return NextResponse.json({
      success: true,
      data: {
        issued: result.issued,
        stock: result.stock,
        movements: await listMovements(year, 40),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to record the allocation" }, { status: 500 });
  }
}