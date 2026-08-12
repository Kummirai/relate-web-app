import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";
import { createNotification } from "@/lib/inapp-notify";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const actor = await resolveSession(request);
    if (!actor || !ObjectId.isValid(actor.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const userRecord = await db
      .collection("user")
      .findOne({ _id: new ObjectId(actor.id) });
    if (userRecord?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const doc = await db
      .collection("help_requests")
      .findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const data = await request.json();
    const assign = data?.assign !== false;
    const now = new Date();
    const actorName = actor.name || "an admin";

    let update: Record<string, unknown> = { updatedAt: now };
    let message: string;
    let notify: { title: string; body: string; type: string } | null = null;

    if (assign) {
      if (doc.status === "resolved" || doc.status === "archived") {
        return NextResponse.json(
          { error: "Resolved or archived requests cannot be assigned" },
          { status: 400 },
        );
      }
      // Assigning to self (or taking over an assignment from another admin).
      if (doc.assignedTo === actor.id) {
        return NextResponse.json({ data: doc });
      }
      const previous = doc.assignedToName
        ? ` (previously ${doc.assignedToName})`
        : "";
      message = `Request assigned to ${actorName}${previous}`;
      update.assignedTo = actor.id;
      update.assignedToName = actorName;
      update.assignedAt = now;
      if (doc.status === "open") update.status = "in_progress";
      notify = {
        type: "help_assigned",
        title: "Your request is being handled",
        body: `${actorName} is now handling your request.`,
      };
    } else {
      // Unassigning — only the assigned admin can release it.
      if (!doc.assignedTo || doc.assignedTo !== actor.id) {
        return NextResponse.json(
          { error: "This request is not assigned to you" },
          { status: 400 },
        );
      }
      message = `Request unassigned by ${actorName}`;
      update.assignedTo = null;
      update.assignedToName = null;
      update.assignedAt = null;
      if (doc.status === "in_progress") update.status = "open";
      notify = {
        type: "help_assigned",
        title: "Update on your request",
        body: "Your request is no longer assigned to a support member.",
      };
    }

    const result = await db
      .collection("help_requests")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: update,
          $push: {
            messages: {
              from: "system",
              fromName: "",
              text: message,
              createdAt: now,
            },
          },
        },
        { returnDocument: "after" },
      );

    // Notify the requester so they see the update in real time.
    // Awaited so Vercel doesn't freeze the function before Expo delivery.
    if (doc.userId && notify) {
      try {
        const tokens = await getUserPushTokens(db, doc.userId);
        await sendPushNotifications(tokens, notify.title, notify.body, {
          type: notify.type,
          requestId: id,
        });
        await createNotification(db, doc.userId, {
          type: notify.type,
          title: notify.title,
          body: notify.body,
          data: { requestId: id },
        });
      } catch {}
    }

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: "Failed to assign request" }, { status: 500 });
  }
}
