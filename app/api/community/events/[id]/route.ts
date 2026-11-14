import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { loadEventRow } from "@/lib/event-payload";

/**
 * One event with the same fields a full list row carries, so a screen can list
 * lean cards and fetch the detail only when a modal opens. Public like the
 * list; the viewer's own RSVP, bookmark and payment state is included when
 * signed in.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const db = await getDb();
    const user = await resolveSession(request);
    const data = await loadEventRow(db, id, user?.id || null);
    if (!data) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(
      { data: { ...data, isOwner: user?.id ? data.userId === user.id : false } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Failed to load event" }, { status: 500 });
  }
}