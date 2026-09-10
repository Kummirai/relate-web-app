import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession, ensureIndexes } from "@/lib/community-auth";

// ---------------------------------------------------------------------------
// Interactive-block responses — Mongo-only, no SQLite, no global read.
// Collection: user_reading_responses
//   { userId, publicationId, date, responses: { [blockId]: value }, updatedAt }
//
// GET  ?publicationId=<id>   — all days' responses for the user + publication
// PUT  { publicationId, date, responses }  — upsert a single day's answers
// ---------------------------------------------------------------------------

const MAX_REFLECTION_LEN = 2000;
const MAX_ITEMS = 64;
const MAX_INDEX = 1024;

/**
 * Sanitise a per-block response value according to the block type. Unknown
 * shapes are dropped (return undefined).
 */
function sanitizeValue(value: unknown): unknown {
  if (value == null) return undefined;

  // Quiz answer — a single index.
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return undefined;
    const n = Math.trunc(value);
    return n >= 0 && n < MAX_INDEX ? n : undefined;
  }

  // Reflection text.
  if (typeof value === "string") {
    return value.trim().slice(0, MAX_REFLECTION_LEN) || undefined;
  }

  // Checklist / pray — array of checked indices.
  if (Array.isArray(value)) {
    const out: number[] = [];
    for (const item of value) {
      if (typeof item !== "number" || !Number.isFinite(item)) continue;
      const n = Math.trunc(item);
      if (n < 0 || n >= MAX_INDEX) continue;
      out.push(n);
      if (out.length >= MAX_ITEMS) break;
    }
    return out.length > 0 ? out : undefined;
  }

  return undefined;
}

function sanitizeResponses(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    // Block ids are slug-like strings (e.g. reflect-9-5).
    if (typeof k !== "string" || k.length > 80) continue;
    const clean = sanitizeValue(v);
    if (clean !== undefined) out[k] = clean;
  }
  return out;
}

// -----------------------------------------------------------------------
// GET
// -----------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const url = new URL(request.url);
    const publicationId = url.searchParams.get("publicationId");
    if (!publicationId) {
      return NextResponse.json(
        { error: "publicationId is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    await ensureIndexes(db);

    const docs = await db
      .collection("user_reading_responses")
      .find({ userId: user.id, publicationId })
      .toArray();

    return NextResponse.json({
      data: docs.map((d: any) => ({
        date: d.date,
        responses: d.responses || {},
      })),
    });
  } catch (e) {
    console.error("[reading-responses] GET error:", e);
    return NextResponse.json(
      { error: "Failed to load responses" },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------
// PUT — upsert a single day's interactive-block responses.
// -----------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const publicationId =
      typeof body?.publicationId === "string"
        ? body.publicationId.trim().slice(0, 120)
        : "";
    const date =
      typeof body?.date === "string" ? body.date.trim().slice(0, 10) : "";

    if (!publicationId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "publicationId and a valid YYYY-MM-DD date are required" },
        { status: 400 },
      );
    }

    const responses = sanitizeResponses(body.responses);

    const db = await getDb();
    await ensureIndexes(db);

    const now = new Date();
    await db.collection("user_reading_responses").updateOne(
      { userId: user.id, publicationId, date },
      {
        $set: { responses, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[reading-responses] PUT error:", e);
    return NextResponse.json(
      { error: "Failed to save responses" },
      { status: 500 },
    );
  }
}
