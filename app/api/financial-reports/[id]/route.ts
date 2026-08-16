import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";

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
