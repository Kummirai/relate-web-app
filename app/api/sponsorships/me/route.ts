import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { ensureSponsorshipIndexes } from "@/lib/models";
import { generateSponsorId } from "../route";

/**
 * The signed-in user's sponsorship identity and transactions:
 * their stable sponsor ID (created on first visit if missing) plus every
 * pledge, newest first. Used by the home dashboard card, "My sponsorships"
 * and the SponsorModal (which prefills the ID).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    await ensureSponsorshipIndexes();

    let userDoc = await db.collection("user").findOne(
      { id: user.id },
      { projection: { sponsorId: 1 } },
    );

    // Auto-create a sponsor ID on first visit so the SponsorModal can
    // prefill it before the user submits their first pledge.
    if (!userDoc?.sponsorId) {
      const sponsorId = await generateUnique(db);
      await db
        .collection("user")
        .updateOne({ id: user.id }, { $set: { sponsorId } }, { upsert: false });
      userDoc = { ...userDoc, sponsorId };
    }

    const transactions = await db
      .collection("sponsorships")
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      data: {
        sponsorId: userDoc?.sponsorId ?? null,
        sponsorships: transactions.map((s: any) => ({
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

async function generateUnique(db: any): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = generateSponsorId();
    const exists = await db.collection("user").findOne({ sponsorId: candidate }, { projection: { _id: 1 } });
    if (!exists) return candidate;
  }
  return generateSponsorId(Date.now() % 1000 + 1000);
}
