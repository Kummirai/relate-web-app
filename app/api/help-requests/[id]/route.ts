import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";
import { createNotification } from "@/lib/inapp-notify";

const EDITABLE_FIELDS = [
  "name",
  "email",
  "phone",
  "area",
  "ageGroup",
  "contactMethod",
  "urgency",
  "whoFor",
  "helpType",
  "description",
] as const;

const MAX_LENGTHS: Record<string, number> = {
  name: 200,
  email: 200,
  phone: 50,
  area: 200,
  ageGroup: 50,
  contactMethod: 50,
  urgency: 50,
  whoFor: 50,
  helpType: 100,
  description: 5000,
};

const STATUSES = ["open", "in_progress", "resolved", "archived"] as const;

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  archived: "Archived",
};

async function getActor(request: NextRequest) {
  const user = await resolveSession(request);
  if (!user || !ObjectId.isValid(user.id)) return null;
  const db = await getDb();
  const record = await db.collection("user").findOne({ _id: new ObjectId(user.id) });
  return { id: user.id, name: user.name, role: record?.role === "admin" ? "admin" : "user" };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }
    const actor = await getActor(request);
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const doc = await db.collection("help_requests").findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isAdmin = actor.role === "admin";
    const isOwner = !!doc.userId && doc.userId === actor.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: doc });
  } catch {
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }
    const actor = await getActor(request);
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const doc = await db.collection("help_requests").findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isAdmin = actor.role === "admin";
    const isOwner = !!doc.userId && doc.userId === actor.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();
    const update: Record<string, unknown> = { updatedAt: new Date() };

    // Admin can change status; every change is logged to the request thread.
    let statusChanged = false;
    if (isAdmin && data.status) {
      const status = String(data.status);
      if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      if (doc.status !== status) {
        update.status = status;
        statusChanged = true;
      }
    }

    // Owner can edit their request fields while it is still open.
    if (data.field && typeof data.field === "object") {
      if (!isAdmin && doc.status && doc.status !== "open") {
        return NextResponse.json(
          { error: "This request can no longer be edited" },
          { status: 400 },
        );
      }
      for (const key of EDITABLE_FIELDS) {
        if (typeof data.field[key] === "string") {
          const val = data.field[key].trim();
          const cap = MAX_LENGTHS[key];
          if (val.length > cap) {
            return NextResponse.json(
              { error: "Some fields exceed the maximum allowed length" },
              { status: 400 },
            );
          }
          if (["name", "helpType", "description"].includes(key) && !val) {
            return NextResponse.json(
              { error: "Name, help type and description are required" },
              { status: 400 },
            );
          }
          update[key] = val;
        }
      }
    }

    const ops: Record<string, unknown> = { $set: update };
    if (statusChanged) {
      const fromLabel = STATUS_LABELS[doc.status] || "Unknown";
      const toLabel = STATUS_LABELS[String(update.status)] || String(update.status);
      ops.$push = {
        messages: {
          from: "system",
          fromName: "",
          text: doc.status
            ? `Status changed from "${fromLabel}" to "${toLabel}" by ${actor.name || "an admin"}`
            : `Status set to "${toLabel}" by ${actor.name || "an admin"}`,
          createdAt: new Date(),
        },
      };
    }

    const result = await db
      .collection("help_requests")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        ops,
        { returnDocument: "after" },
      );

    // Notify the requester in real time when an admin changes the status.
    // Awaited so Vercel doesn't freeze the function before Expo delivery.
    if (statusChanged && doc.userId && doc.userId !== actor.id) {
      const fromLabel = STATUS_LABELS[doc.status] || "Unknown";
      const toLabel = STATUS_LABELS[String(update.status)] || String(update.status);
      try {
        const title = "Update on your help request";
        const body = `Your request status changed from "${fromLabel}" to "${toLabel}".`;
        const tokens = await getUserPushTokens(db, doc.userId);
        await sendPushNotifications(tokens, title, body, {
          type: "help_status",
          requestId: id,
        });
        await createNotification(db, doc.userId, {
          type: "help_status",
          title,
          body,
          data: { requestId: id },
        });
      } catch {}
    }

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }
    const actor = await getActor(request);
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const doc = await db.collection("help_requests").findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isAdmin = actor.role === "admin";
    const isOwner = !!doc.userId && doc.userId === actor.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isAdmin && doc.status && doc.status !== "open") {
      return NextResponse.json(
        { error: "Completed or archived requests cannot be deleted" },
        { status: 400 },
      );
    }

    await db.collection("help_requests").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete request" }, { status: 500 });
  }
}
