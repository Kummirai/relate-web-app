import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { ensureSponsorshipIndexes } from "@/lib/models";
import { generateSponsorId } from "../route";

/**
 * Idempotent: returns the user's existing sponsor ID, or creates one if they
 * don't have one yet. Called by the SponsorModal on first open so the ID
 * can be prefilled — but only triggers creation once.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    await ensureSponsorshipIndexes();

    // Already has one — return it.
    const existing = await db
      .collection("user")
      .findOne({ id: user.id }, { projection: { sponsorId: 1 } });

    if (existing?.sponsorId) {
      return NextResponse.json({ sponsorId: existing.sponsorId });
    }

    // Generate a unique sponsor id.
    let sponsorId: string | null = null;
    for (let i = 0; i < 5; i++) {
      const candidate = generateSponsorId();
      const onUser = await db
        .collection("user")
        .findOne({ sponsorId: candidate }, { projection: { _id: 1 } });
      const onSponsorship = await db
        .collection("sponsorships")
        .findOne({ sponsorId: candidate }, { projection: { _id: 1 } });
      if (!onUser && !onSponsorship) {
        sponsorId = candidate;
        break;
      }
    }
    if (!sponsorId) {
      sponsorId = generateSponsorId(Date.now() % 1000 + 1000);
    }

    await db
      .collection("user")
      .updateOne(
        { id: user.id },
        { $set: { sponsorId } },
        { upsert: false },
      );

    return NextResponse.json({ sponsorId });
  } catch {
    return NextResponse.json(
      { error: "Failed to ensure sponsor ID" },
      { status: 500 },
    );
  }
}
