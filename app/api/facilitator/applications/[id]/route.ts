import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin, findUserById } from "@/lib/community-auth";
import { createNotification } from "@/lib/inapp-notify";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";

const ACTIONS = ["approve", "reject", "confirm-training"] as const;

/**
 * Admin review of a facilitator application.
 *
 *  - approve: pending -> approved, grants the "facilitator" role (groups stay
 *    locked until training is confirmed).
 *  - confirm-training: approved -> trained, unlocks group creation.
 *  - reject: pending/approved -> rejected; revokes the facilitator role if it
 *    had been granted.
 *
 * The applicant is notified (push + in-app) on every outcome.
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
        { error: 'action must be "approve", "reject" or "confirm-training"' },
        { status: 400 },
      );
    }

    const db = await getDb();
    const app = await db
      .collection("facilitator_applications")
      .findOne({ _id: new ObjectId(id) });
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const uid = app.userId;
    const user = await findUserById(db, uid);

    const notifyUser = async (type: string, title: string, bodyText: string) => {
      await createNotification(db, uid, {
        type,
        title,
        body: bodyText,
        data: { applicationId: id },
      });
      const tokens = await getUserPushTokens(db, uid);
      await sendPushNotifications(tokens, title, bodyText);
    };

    if (action === "approve") {
      if (app.status !== "pending") {
        return NextResponse.json(
          { error: "Application is not pending" },
          { status: 400 },
        );
      }
      await db.collection("facilitator_applications").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "approved", reviewedAt: new Date(), reviewedBy: admin.id } },
      );
      if (user) {
        await db.collection("user").updateOne(
          { _id: user._id },
          {
            $set: {
              role: "facilitator",
              facilitatorTrainingCompleted: false,
              updatedAt: new Date(),
            },
          },
        );
      }
      await notifyUser(
        "facilitator_approved",
        "Facilitator application approved",
        "Complete your 1-hour facilitator training, then ask an admin to confirm it.",
      );
    } else if (action === "confirm-training") {
      if (app.status !== "approved") {
        return NextResponse.json(
          { error: "Training can only be confirmed for approved applicants" },
          { status: 400 },
        );
      }
      await db.collection("facilitator_applications").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: "trained",
            trainedAt: new Date(),
            reviewedAt: new Date(),
            reviewedBy: admin.id,
          },
        },
      );
      if (user) {
        await db.collection("user").updateOne(
          { _id: user._id },
          { $set: { facilitatorTrainingCompleted: true, updatedAt: new Date() } },
        );
      }
      await notifyUser(
        "facilitator_trained",
        "You are now a facilitator",
        "You can now create community groups.",
      );
    } else {
      if (app.status !== "pending" && app.status !== "approved") {
        return NextResponse.json(
          { error: "Application cannot be rejected" },
          { status: 400 },
        );
      }
      await db.collection("facilitator_applications").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "rejected", reviewedAt: new Date(), reviewedBy: admin.id } },
      );
      if (user && user.role === "facilitator") {
        await db.collection("user").updateOne(
          { _id: user._id },
          {
            $set: {
              role: "user",
              facilitatorTrainingCompleted: false,
              updatedAt: new Date(),
            },
          },
        );
      }
      await notifyUser(
        "facilitator_rejected",
        "Facilitator application",
        "Your facilitator application was not approved.",
      );
    }

    const updated = await db
      .collection("facilitator_applications")
      .findOne({ _id: new ObjectId(id) });
    return NextResponse.json({
      data: { ...updated, _id: updated._id.toString() },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 },
    );
  }
}
