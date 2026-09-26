import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";
import { createNotification } from "@/lib/inapp-notify";
import {
  VOLUNTEER_STATUSES,
  ensureVolunteerIndexes,
  serializeVolunteer,
} from "@/lib/volunteers";

/**
 * Admin volunteer-request review.
 *
 *  - PATCH: update status / admin note / assignment. Admin only.
 *  - DELETE: remove an application. Admin only.
 */

const VALID_STATUS = new Set<string>(VOLUNTEER_STATUSES);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const db = await getDb();
    await ensureVolunteerIndexes(db);
    const col = db.collection("volunteer_requests");
    const _id = new ObjectId(id);

    const existing = await col.findOne({ _id });
    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (typeof body.status === "string") {
      if (!VALID_STATUS.has(body.status)) {
        return NextResponse.json(
          { error: `status must be one of ${VOLUNTEER_STATUSES.join(", ")}` },
          { status: 400 },
        );
      }
      update.status = body.status;
      if (body.status === "active" || body.status === "declined") {
        update.reviewedAt = new Date();
        update.reviewedBy = admin.id;
      }
    }

    if (typeof body.adminNote === "string") {
      update.adminNote = body.adminNote.trim().slice(0, 2000) || null;
    }

    // Explicit unassign, otherwise ignore — assignment has its own route.
    if (body.assignedTo === null) {
      update.assignedTo = null;
      update.assignedToName = null;
      update.assignedAt = null;
    }

    await col.updateOne({ _id }, { $set: update });

    // Tell the volunteer where things stand.
    if (update.status && existing.userId && existing.status !== update.status) {
      const status = update.status as string;
      const copy: Record<string, string> = {
        reviewing: "We are reviewing your volunteer application.",
        contacted: "Thanks for applying — someone from the team will be in touch.",
        active: "Welcome aboard! Your volunteer application was approved.",
        declined:
          "Thank you for offering your time. We are unable to take you forward right now.",
      };
      const text = copy[status];
      if (text) {
        await Promise.all([
          createNotification(db, existing.userId, {
            type: "volunteer_status",
            title: "Volunteer application updated",
            body: text,
            data: { volunteerId: id, status },
          }).catch((e) => console.error("[volunteers] notify failed:", e)),
          getUserPushTokens(db, existing.userId)
            .then((tokens) =>
              sendPushNotifications(tokens, "Volunteer application updated", text),
            )
            .catch((e) => console.error("[volunteers] push failed:", e)),
        ]);
      }
    }

    const updated = await col.findOne({ _id });
    return NextResponse.json({
      data: serializeVolunteer(updated),
    });
  } catch (e) {
    console.error("[admin/volunteers] PATCH error:", e);
    return NextResponse.json(
      { error: "Failed to update volunteer request" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    }

    const db = await getDb();
    await ensureVolunteerIndexes(db);
    const result = await db
      .collection("volunteer_requests")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/volunteers] DELETE error:", e);
    return NextResponse.json(
      { error: "Failed to delete volunteer request" },
      { status: 500 },
    );
  }
}
