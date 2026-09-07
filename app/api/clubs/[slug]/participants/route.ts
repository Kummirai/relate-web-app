import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession, findUserById } from "@/lib/community-auth";

/**
 * Lists the participants (club registrations) for a club.
 *
 * Access control: admin, or a facilitator with training completed (the same
 * rule that unlocks group creation). This is the roster that lets club leads
 * see who has registered — including the activity each joined (e.g. bible_quiz).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const clubSlug = String(slug || "").trim().toLowerCase();
    if (!clubSlug) {
      return NextResponse.json({ error: "Club is required" }, { status: 400 });
    }

    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in to view participants" }, { status: 401 });
    }

    const userDoc = await findUserById(db, user.id);
    const role = userDoc?.role || "user";
    const isAdmin = role === "admin";
    const isTrainedFacilitator =
      role === "facilitator" && userDoc?.facilitatorTrainingCompleted === true;
    if (!isAdmin && !isTrainedFacilitator) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const rows = await db
      .collection("club_registrations")
      .find({ clubSlug })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      data: rows.map((r: any) => ({
        _id: r._id.toString(),
        userId: r.userId,
        name: r.name,
        clubSlug: r.clubSlug,
        answers: r.answers || {},
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (e) {
    console.error("[clubs/participants] GET error:", e);
    return NextResponse.json(
      { error: "Failed to load participants" },
      { status: 500 },
    );
  }
}
