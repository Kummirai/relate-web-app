import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { resolveSession, requireAdmin } from "@/lib/community-auth";

/**
 * Event payment management (event owner / admin only).
 *
 * POST — mark an attendee as paid / unpaid:   { userId, paid }
 * PUT  — attach a proof-of-payment image URL: { userId, popUrl }
 *
 * The POP image bytes are uploaded by the client to storage (Supabase) and
 * only the resulting public URL is persisted here, mirroring the event image
 * flow. New RSVPs always start as unpaid (see /rsvp).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(request, params, "paid");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(request, params, "pop");
}

async function handle(
  request: NextRequest,
  params: Promise<{ id: string }>,
  action: "paid" | "pop",
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const event = await db
      .collection("community_events")
      .findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isAdmin = !!(await requireAdmin(request));
    const isOwner =
      event.userId === user.id ||
      (!event.userId && !!user.name && event.author === user.name);
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetUserId = String(body.userId || "");
    if (!targetUserId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    if (action === "paid") {
      const paid = !!body.paid;
      await db.collection("event_registrations").updateOne(
        { eventId: new ObjectId(id), userId: targetUserId },
        {
          $set: {
            paid,
            paidAt: paid ? new Date().toISOString() : null,
            markedPaidBy: paid ? user.id : null,
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
      return NextResponse.json({ data: { userId: targetUserId, paid } });
    }

    const popUrl = String(body.popUrl || "").trim();
    if (!popUrl) {
      return NextResponse.json(
        { error: "popUrl is required" },
        { status: 400 },
      );
    }
    await db.collection("event_registrations").updateOne(
      { eventId: new ObjectId(id), userId: targetUserId },
      { $set: { popUrl, updatedAt: new Date() } },
      { upsert: true },
    );
    return NextResponse.json({ data: { userId: targetUserId, popUrl } });
  } catch {
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 },
    );
  }
}
