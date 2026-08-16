import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession, requireAdmin } from "@/lib/community-auth";
import { buildFinancialReport } from "@/lib/financial-reports";

/**
 * Signed-in users: the full detail of one published financial report so the
 * report viewer can render every line item.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const db = await getDb();
    const doc = await db
      .collection("financial_reports")
      .findOne({ _id: new ObjectId(id) });

    if (!doc || (doc.status && doc.status !== "published")) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        _id: doc._id.toString(),
        period: doc.period,
        preparedBy: doc.preparedBy,
        createdAt: doc.createdAt,
        income: doc.income || {},
        expenses: doc.expenses || {},
        impact: doc.impact || {},
        notes: doc.notes || "",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load financial report" },
      { status: 500 },
    );
  }
}

/**
 * Admin only: edit a published financial report in place. The report stays
 * published so users keep seeing the corrected figures (no re-notification —
 * they already received the "published" alert).
 */
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
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const report = buildFinancialReport(body, admin.name || "Relate Admin");
    if (!report.period) {
      return NextResponse.json(
        { error: "Report period is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const existing = await db
      .collection("financial_reports")
      .findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    await db.collection("financial_reports").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...report,
          updatedAt: new Date(),
          updatedBy: admin.id,
        },
      },
    );

    return NextResponse.json({ data: { _id: id, period: report.period } });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update financial report" },
      { status: 500 },
    );
  }
}
