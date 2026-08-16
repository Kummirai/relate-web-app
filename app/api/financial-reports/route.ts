import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession, ensureIndexes } from "@/lib/community-auth";

function sumFields(doc: any, keys: string[]): number {
  if (!doc || typeof doc !== "object") return 0;
  return keys.reduce((total, key) => total + (Number(doc[key]) || 0), 0);
}

/**
 * Signed-in users: every published financial report, newest first, with the
 * headline totals already computed so the list can render without a second
 * fetch. Legacy reports (saved before "status" existed) are included.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    await ensureIndexes(db);

    const docs = await db
      .collection("financial_reports")
      .find({
        $or: [{ status: "published" }, { status: { $exists: false } }],
      })
      .sort({ createdAt: -1 })
      .limit(60)
      .toArray();

    return NextResponse.json({
      data: docs.map((r: any) => {
        const income = sumFields(r.income, [
          "sponsorships",
          "events",
          "donations",
          "books",
          "other",
        ]);
        const expenses = sumFields(r.expenses, [
          "meals",
          "groceries",
          "tuition",
          "transport",
          "employment",
          "materials",
          "other",
        ]);
        return {
          _id: r._id.toString(),
          period: r.period,
          preparedBy: r.preparedBy,
          createdAt: r.createdAt,
          income,
          expenses,
          net: income - expenses,
        };
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load financial reports" },
      { status: 500 },
    );
  }
}
