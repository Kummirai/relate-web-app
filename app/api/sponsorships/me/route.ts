import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { ensureSponsorshipIndexes } from "@/lib/models";

/**
 * The signed-in user's sponsorship identity and transactions:
 * their stable sponsor ID (if they have pledged before) plus every pledge,
 * newest first. Used by the home dashboard card and "My sponsorships".
 */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    await ensureSponsorshipIndexes();
    const [userDoc, transactions] = await Promise.all([
      db.collection("user").findOne(
        { id: user.id },
        { projection: { sponsorId: 1 } },
      ),
      db
        .collection("sponsorships")
        .find({ userId: user.id })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray(),
    ]);

    return NextResponse.json({
      data: {
        sponsorId: userDoc?.sponsorId ?? null,
        sponsorships: transactions.map((s) => ({
          _id: s._id.toString(),
          sponsorId: s.sponsorId,
          name: s.name,
          amount: s.amount,
          popUrl: s.popUrl,
          status: s.status,
          createdAt: s.createdAt,
        })),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch your sponsorships" },
      { status: 500 },
    );
  }
}
