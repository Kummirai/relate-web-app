import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { ensureSessionIndexes } from "@/lib/sessions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const db = await getDb();
    await ensureSessionIndexes();

    const session = await db.collection("sessions").findOne({ _id: new ObjectId(id) });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // MVP supports cancel only; the partial unique index drops the session
    // from (tutorId, date, time) so the slot becomes bookable again.
    if (body.status !== "cancelled") {
      return NextResponse.json(
        { error: "Only cancellation is supported" },
        { status: 400 },
      );
    }
    if (session.status !== "confirmed") {
      return NextResponse.json(
        { error: "This session can no longer be cancelled" },
        { status: 400 },
      );
    }

    const now = new Date();
    await db.collection("sessions").updateOne(
      { _id: session._id },
      { $set: { status: "cancelled", cancelledAt: now, updatedAt: now } },
    );

    return NextResponse.json({ data: { ...session, status: "cancelled", cancelledAt: now } });
  } catch {
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}