import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/community-auth";
import { deleteMovement, updateMovement } from "@/lib/school-kit";

/**
 * Correct the stock ledger.
 *
 *   PATCH  /api/admin/school-kit/movements/:id   Edit item, quantity, cost,
 *          date or note. The ledger is replayed and refused if stock would
 *          go negative.
 *   DELETE /api/admin/school-kit/movements/:id   Remove a row (an allocation
 *          row returns its items to stock).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "A movement payload is required." }, { status: 400 });
    }

    const result = await updateMovement({
      id,
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

    return NextResponse.json({
      success: true,
      data: {
        stock: result.stock,
        movements: result.movements,
        season: result.season,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update the stock movement" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const result = await deleteMovement({ id });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      data: {
        stock: result.stock,
        movements: result.movements,
        season: result.season,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to delete the stock movement" }, { status: 500 });
  }
}