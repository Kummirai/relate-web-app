import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";
import { createNotification } from "@/lib/inapp-notify";
import { ensureVolunteerIndexes, serializeVolunteer } from "@/lib/volunteers";

/**
 * Assign (or release) a volunteer request to an admin, so it's clear who is
 * having the conversation. Mirrors the help-requests assign route.
 */

export async function POST(
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
    const assign = body?.assign !== false;

    const db = await getDb();
    await ensureVolunteerIndexes(db);
    const col = db.collection("volunteer_requests");
    const _id = new ObjectId(id);

    const doc = await col.findOne({ _id });
    if (!doc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const now = new Date();
    const adminName = admin.name || "an admin";
    const update: Record<string, unknown> = { updatedAt: now };
    let message: string;

    if (assign) {
      if (doc.assignedTo === admin.id) {
        return NextResponse.json({ data: serializeVolunteer(doc) });
      }
      const previous = doc.assignedToName ? ` (previously ${doc.assignedToName})` : "";
      message = `Volunteer request assigned to ${adminName}${previous}`;
      update.assignedTo = admin.id;
      update.assignedToName = adminName;
      update.assignedAt = now;
      if (doc.status === "new") update.status = "reviewing";
    } else {
      if (!doc.assignedTo || doc.assignedTo !== admin.id) {
        return NextResponse.json(
          { error: "This request is not assigned to you" },
          { status: 400 },
        );
      }
      message = `Volunteer request unassigned by ${adminName}`;
      update.assignedTo = null;
      update.assignedToName = null;
      update.assignedAt = null;
      if (doc.status === "reviewing") update.status = "new";
    }

    const updated = await col.findOneAndUpdate(
      { _id },
      {
        $set: update,
        $push: {
          timeline: { text: message, by: adminName, createdAt: now },
        },
      },
      { returnDocument: "after" },
    );

    if (doc.userId) {
      try {
        const title = assign ? "Someone is reviewing your application" : "Application update";
        const text = assign
          ? `${adminName} is now looking after your volunteer application.`
          : `Your volunteer application is back in the queue.`;
        const tokens = await getUserPushTokens(db, doc.userId);
        await sendPushNotifications(tokens, title, text, {
          type: "volunteer_assigned",
          volunteerId: id,
        });
        await createNotification(db, doc.userId, {
          type: "volunteer_assigned",
          title,
          body: text,
          data: { volunteerId: id },
        });
      } catch {}
    }

    return NextResponse.json({ data: serializeVolunteer(updated) });
  } catch (e) {
    console.error("[admin/volunteers/assign] error:", e);
    return NextResponse.json(
      { error: "Failed to assign volunteer request" },
      { status: 500 },
    );
  }
}
