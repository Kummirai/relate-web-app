import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";
import { createNotification } from "@/lib/inapp-notify";

const STATUSES = ["pending", "in_review", "approved", "rejected"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
};

async function getActor(request: NextRequest) {
  const user = await resolveSession(request);
  if (!user || !ObjectId.isValid(user.id)) return null;
  const db = await getDb();
  const record = await db
    .collection("user")
    .findOne({ _id: new ObjectId(user.id) });
  return {
    id: user.id,
    name: user.name,
    role: record?.role === "admin" ? "admin" : "user",
  };
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
    const doc = await db
      .collection("school_grants")
      .findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const isAdmin = actor.role === "admin";
    const isOwner = !!doc.userId && doc.userId === actor.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: doc });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 },
    );
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
    if (actor.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await getDb();
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
    const update: Record<string, unknown> = { updatedAt: new Date() };
    const updates: string[] = [];

    if (data.status) {
      const status = String(data.status);
      if (!(STATUSES as readonly string[]).includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      if (doc.status !== status) {
        update.status = status;
        const fromLabel = STATUS_LABELS[doc.status] || "Unknown";
        const toLabel = STATUS_LABELS[status] || status;
        updates.push(
          `Status changed from "${fromLabel}" to "${toLabel}" by ${
            actor.name || "an admin"
          }`,
        );
      }
    }

    // Admin decides amount and period per response (no fixed defaults).
    if (typeof data.amount === "string" && data.amount !== doc.amount) {
      const amount = data.amount.trim().slice(0, 200);
      if (amount) {
        update.amount = amount;
        updates.push(`Amount set to "${amount}"`);
      }
    }
    if (typeof data.period === "string" && data.period !== doc.period) {
      const period = data.period.trim().slice(0, 200);
      if (period) {
        update.period = period;
        updates.push(`Period set to "${period}"`);
      }
    }
    if (typeof data.adminNotes === "string") {
      const notes = data.adminNotes.trim().slice(0, 3000);
      if (notes !== (doc.adminNotes || "")) {
        update.adminNotes = notes;
      }
    }

    const ops: Record<string, unknown> = { $set: update };
    if (updates.length) {
      ops.$push = {
        messages: {
          from: "system",
          fromName: "",
          text: updates.join(" · "),
          createdAt: new Date(),
        },
      };
    }

    const result = await db
      .collection("school_grants")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        ops,
        { returnDocument: "after" },
      );

    // Notify the applicant when an admin changes the status.
    const statusChanged =
      result && doc.status !== result.status;
    if (statusChanged && doc.userId && doc.userId !== actor.id) {
      const toStatus = String(result.status);
      const finalLabel = STATUS_LABELS[toStatus] || toStatus;
      try {
        const approved = toStatus === "approved";
        const title = approved
          ? "Your school grant was approved"
          : "Update on your school grant";
        const body = approved
          ? `Congratulations — your grant was approved${result.amount ? ` for ${result.amount}` : ""}.`
          : toStatus === "rejected"
            ? "We're sorry — your school grant application was not approved this time."
            : `Your application status is now "${finalLabel}".`;
        const tokens = await getUserPushTokens(db, doc.userId);
        await sendPushNotifications(tokens, title, body, {
          type: "school_grant_status",
          grantId: id,
        });
        await createNotification(db, doc.userId, {
          type: "school_grant_status",
          title,
          body,
          data: { grantId: id },
        });
      } catch {}
    }

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 },
    );
  }
}
