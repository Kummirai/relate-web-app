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
      .collection("school_grants")
      .findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const data = await request.json();
    const assign = data?.assign !== false;
    const now = new Date();
    const actorName = actor.name || "an admin";

    let update: Record<string, unknown> = { updatedAt: now };
    let message: string;
    let notify: { title: string; body: string; type: string } | null = null;

    if (assign) {
      if (doc.status === "approved" || doc.status === "rejected") {
        return NextResponse.json(
          { error: "Decided applications cannot be assigned" },
          { status: 400 },
        );
      }
      if (doc.assignedTo === actor.id) {
        return NextResponse.json({ data: doc });
      }
      const previous = doc.assignedToName
        ? ` (previously ${doc.assignedToName})`
        : "";
      message = `Application assigned to ${actorName}${previous}`;
      update.assignedTo = actor.id;
      update.assignedToName = actorName;
      update.assignedAt = now;
      if (doc.status === "pending") update.status = "in_review";
      notify = {
        type: "school_grant_assigned",
        title: "Your application is being reviewed",
        body: `${actorName} is now reviewing your school grant application.`,
      };
    } else {
      if (!doc.assignedTo || doc.assignedTo !== actor.id) {
        return NextResponse.json(
          { error: "This application is not assigned to you" },
          { status: 400 },
        );
      }
      message = `Application unassigned by ${actorName}`;
      update.assignedTo = null;
      update.assignedToName = null;
      update.assignedAt = null;
      if (doc.status === "in_review") update.status = "pending";
      notify = {
        type: "school_grant_assigned",
        title: "Update on your application",
        body: "Your school grant application is no longer assigned to a reviewer.",
      };
    }

    const result = await db
      .collection("school_grants")
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

    if (doc.userId && notify) {
      try {
        const tokens = await getUserPushTokens(db, doc.userId);
        await sendPushNotifications(tokens, notify.title, notify.body, {
          type: notify.type,
          grantId: id,
        });
        await createNotification(db, doc.userId, {
          type: notify.type,
          title: notify.title,
          body: notify.body,
          data: { grantId: id },
        });
      } catch {}
    }

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json(
      { error: "Failed to assign application" },
      { status: 500 },
    );
  }
}
