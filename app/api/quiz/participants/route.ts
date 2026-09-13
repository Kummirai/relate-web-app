import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { createParticipant, findParticipants } from "@/lib/quiz-season";

/**
 * GET /api/quiz/participants?clubSlug=...&q=... — search players of a club.
 * POST /api/quiz/participants { name, clubSlug } — create or reuse a player.
 * Children play quiz as lightweight participants; a signed-in user is linked
 * when available so their profile avatar can be reused.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const clubSlug = String(params.get("clubSlug") || "").trim().toLowerCase();
    if (!clubSlug) {
      return NextResponse.json({ error: "clubSlug is required" }, { status: 400 });
    }
    const db = await getDb();
    const q = params.get("q") || undefined;
    const rows = await findParticipants(db, clubSlug, q);
    return NextResponse.json({
      participants: rows.map((p) => ({
        participantId: p.participantId,
        name: p.name,
        clubSlug: p.clubSlug,
        avatarColor: p.avatarColor,
        image: p.image ?? null,
        createdAt: p.createdAt,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to load participants" }, { status: e.status || 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      clubSlug?: string;
    };
    const clubSlug = String(body.clubSlug || "").trim().toLowerCase();
    if (!clubSlug) {
      return NextResponse.json({ error: "clubSlug is required" }, { status: 400 });
    }
    const user = await resolveSession(request);
    const participant = await createParticipant({
      name: body.name || "",
      clubSlug,
      userId: user?.id ?? null,
    });
    return NextResponse.json({
      participant: {
        participantId: participant.participantId,
        name: participant.name,
        clubSlug: participant.clubSlug,
        avatarColor: participant.avatarColor,
        image: participant.image ?? null,
        createdAt: participant.createdAt,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to create participant" }, { status: e.status || 500 });
  }
}