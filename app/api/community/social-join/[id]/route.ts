import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import { createNotification } from "@/lib/inapp-notify";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";

const ACTIONS = ["approve", "reject"] as const;

/**
 * Admin review of a social join request.
 *
 *  - approve: pending -> approved, user can see WhatsApp link.
 *  - reject: pending -> rejected, user cannot see link.
 */
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
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const action = body.action;
    if (!ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 },
      );
    }

    const db = await getDb();
    const join = await db
      .collection("community_social_joins")
      .findOne({ _id: new ObjectId(id) });
    if (!join) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (join.status !== "pending") {
      return NextResponse.json(
        { error: "Request has already been reviewed" },
        { status: 409 },
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    await db.collection("community_social_joins").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: newStatus,
          reviewedAt: new Date(),
          reviewedBy: admin.id,
          updatedAt: new Date(),
        },
      },
    );

    // Notify the user
    const uid = join.userId;
    const title =
      action === "approve"
        ? "WhatsApp community access approved"
        : "WhatsApp community request";
    const bodyText =
      action === "approve"
        ? "You can now join the Relate WhatsApp community."
        : "Your request to join the WhatsApp community was not approved.";

    await createNotification(db, uid, {
      type: "social_join",
      title,
      body: bodyText,
      data: { joinId: id },
    });
    const tokens = await getUserPushTokens(db, uid);
    await sendPushNotifications(tokens, title, bodyText);

    const updated = await db
      .collection("community_social_joins")
      .findOne({ _id: new ObjectId(id) });
    return NextResponse.json({
      data: { ...updated, _id: updated._id.toString() },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 },
    );
  }
}
