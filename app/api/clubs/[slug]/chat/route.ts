import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  resolveSession,
  requireAdmin,
  ensureIndexes,
} from "@/lib/community-auth";

// ---------------------------------------------------------------------------
// Club chat — lean, Mongo-only, no polling / no SQLite.
// Collection: club_chat_messages { clubSlug, userId, authorName, text,
//   context?, createdAt }
//
// GET  ?after=<ISO>&limit=50   — newest-first then reversed for display
// POST { text, context? }      — post a message (member-only gate)
// ---------------------------------------------------------------------------

const MAX_TEXT = 1000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const CONTEXT_LIMITS: Record<string, number> = {
  series: 80,
  publicationId: 120,
  title: 100,
};

/** Returns null when the user is allowed; a NextResponse with the denial. */
async function assertMember(
  request: NextRequest,
  clubSlug: string,
): Promise<{ userId: string; authorName: string } | NextResponse> {
  const userId = await resolveSession(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to use chat" }, { status: 401 });
  }

  if (clubSlug === "relate") return { userId: userId.id, authorName: userId.name || "Anonymous" };

  const db = await getDb();
  const hasRegistration = await db
    .collection("club_registrations")
    .findOne({ userId: userId.id, clubSlug }, { projection: { _id: 1 } });

  if (!hasRegistration) {
    return NextResponse.json(
      { error: "Register for this club to use chat" },
      { status: 403 },
    );
  }

  return { userId: userId.id, authorName: userId.name || "Anonymous" };
}

function sanitizeContext(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, limit] of Object.entries(CONTEXT_LIMITS)) {
    const v = (raw as Record<string, unknown>)[k];
    if (typeof v === "string" && v.trim()) {
      out[k] = v.trim().slice(0, limit);
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

// -----------------------------------------------------------------------
// GET
// -----------------------------------------------------------------------
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

    const userId = await resolveSession(request);
    if (!userId) {
      return NextResponse.json({ error: "Sign in to view chat" }, { status: 401 });
    }

    // Members + admins can view; also the global "relate" channel is open to
    // any signed-in user.
    if (clubSlug !== "relate") {
      const db = await getDb();
      const isMember = await db
        .collection("club_registrations")
        .findOne({ userId: userId.id, clubSlug }, { projection: { _id: 1 } });
      if (!isMember) {
        const admin = await requireAdmin(request);
        if (!admin) {
          return NextResponse.json(
            { error: "Register for this club to view chat" },
            { status: 403 },
          );
        }
      }
    }

    const url = new URL(request.url);
    const after = url.searchParams.get("after");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      MAX_LIMIT,
    );

    const db = await getDb();
    const filter: Record<string, unknown> = { clubSlug };
    if (after) {
      const cursor = new Date(after);
      if (!isNaN(cursor.getTime())) {
        filter.createdAt = { $gt: cursor };
      }
    }

    const docs = await db
      .collection("club_chat_messages")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Reverse to chronological order (oldest first) for display.
    docs.reverse();

    return NextResponse.json({
      data: docs.map((d: any) => ({
        _id: d._id.toString(),
        clubSlug: d.clubSlug,
        userId: d.userId,
        authorName: d.authorName,
        text: d.text,
        context: d.context || null,
        createdAt: d.createdAt,
      })),
    });
  } catch (e) {
    console.error("[clubs/chat] GET error:", e);
    return NextResponse.json(
      { error: "Failed to load chat" },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------
// POST
// -----------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const clubSlug = String(slug || "").trim().toLowerCase();
    if (!clubSlug) {
      return NextResponse.json({ error: "Club is required" }, { status: 400 });
    }

    const gate = await assertMember(request, clubSlug);
    if (gate instanceof NextResponse) return gate;
    const { userId, authorName } = gate;

    const body = await request.json().catch(() => ({}));
    const text =
      typeof body?.text === "string" ? body.text.trim().slice(0, MAX_TEXT) : "";
    if (!text) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 },
      );
    }

    const db = await getDb();
    await ensureIndexes(db);

    const doc = {
      clubSlug,
      userId,
      authorName,
      text,
      context: sanitizeContext(body.context),
      createdAt: new Date(),
    };

    const result = await db.collection("club_chat_messages").insertOne(doc);

    return NextResponse.json(
      {
        data: {
          _id: result.insertedId.toString(),
          ...doc,
        },
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("[clubs/chat] POST error:", e);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
