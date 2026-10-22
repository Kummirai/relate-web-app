import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { CLUB_SERVICES_COLLECTION, serializeService } from "@/lib/club-services";

/**
 * Release a claimed service (before or after submitting) so it returns to
 * the open list for someone else.
 */
export async function POST(
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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const updated = await db.collection(CLUB_SERVICES_COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id), acceptedById: user.id, status: { $in: ["accepted", "submitted"] } },
      {
        $set: {
          status: "open",
          acceptedById: null,
          acceptedByName: null,
          acceptedAt: null,
          submission: null,
          updatedAt: now,
        },
      },
      { returnDocument: "after" },
    );

    if (!updated) {
      return NextResponse.json(
        { error: "You have not claimed this service." },
        { status: 409 },
      );
    }

    return NextResponse.json({ data: serializeService(updated) });
  } catch {
    return NextResponse.json({ error: "Failed to withdraw" }, { status: 500 });
  }
}
