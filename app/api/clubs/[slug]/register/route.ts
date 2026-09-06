import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession, ensureIndexes } from "@/lib/community-auth";
import { notifyAdmins } from "@/lib/inapp-notify";

/**
 * Club registration — the unique per-club sign-up form shown before a user
 * joins a club's WhatsApp group.
 *
 *  - POST: signed-in user submits the club's registration fields (answers are
 *    free-form key/value pairs so each club's unique form is supported).
 *    Notifies all admins (in-app) as fire-and-forget-safe.
 *  - GET: returns the caller's own registration for the club (or null).
 */

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

    const rawBody = await request.json().catch(() => ({}));
    const answers: Record<string, string> = {};
    if (rawBody && typeof rawBody === "object") {
      for (const [k, v] of Object.entries(rawBody.answers || rawBody)) {
        if (typeof v === "string" && v.trim()) {
          answers[k.slice(0, 60)] = v.trim().slice(0, 1000);
        }
      }
    }
    if (Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: "Please complete the registration form" },
        { status: 400 },
      );
    }

    const db = await getDb();
    await ensureIndexes(db);

    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in to register" }, { status: 401 });
    }

    // Prevent duplicate pending registrations per club.
    const existing = await db.collection("club_registrations").findOne({
      userId: user.id,
      clubSlug,
      status: "pending",
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a registration under review for this club." },
        { status: 409 },
      );
    }

    const doc = {
      userId: user.id,
      name: user.name || "Unknown",
      clubSlug,
      answers,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("club_registrations").insertOne(doc);

    const title = "New club registration";
    const bodyText = `${doc.name} registered for the ${clubSlug} club.`;
    try {
      await notifyAdmins(
        db,
        {
          type: "club_registration",
          title,
          body: bodyText,
          data: { registrationId: result.insertedId.toString(), clubSlug },
        },
        user.id,
      );
    } catch {}

    return NextResponse.json(
      { data: { ...doc, _id: result.insertedId.toString() } },
      { status: 201 },
    );
  } catch (e) {
    console.error("[clubs/register] POST error:", e);
    return NextResponse.json(
      { error: "Failed to submit registration" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const clubSlug = String(slug || "").trim().toLowerCase();
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ data: null });

    const mine = await db.collection("club_registrations").findOne(
      { userId: user.id, clubSlug },
      { sort: { createdAt: -1 } },
    );
    if (!mine) return NextResponse.json({ data: null });
    return NextResponse.json({
      data: { ...mine, _id: mine._id.toString() },
    });
  } catch {
    return NextResponse.json({ data: null });
  }
}
