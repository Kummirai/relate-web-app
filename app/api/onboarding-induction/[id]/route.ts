import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { findUserById, requireAdmin } from "@/lib/community-auth";
import { createNotification } from "@/lib/inapp-notify";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";
import {
  ONBOARDING_COLLECTION,
  isApproverEmail,
  serializeOnboarding,
} from "@/lib/onboarding-induction";

const ACTIONS = ["approve", "reject", "retake"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const approver = await findUserById(db, admin.id);
    if (!isApproverEmail(approver?.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    if (!ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve", "reject" or "retake"' },
        { status: 400 },
      );
    }

    const submission = await db
      .collection(ONBOARDING_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    if (action === "retake") {
      if (!["pending", "approved", "rejected"].includes(String(submission.status))) {
        return NextResponse.json(
          { error: "This submission cannot be sent for retake" },
          { status: 409 },
        );
      }
    } else if (submission.status !== "pending") {
      return NextResponse.json(
        { error: "Submission has already been reviewed" },
        { status: 409 },
      );
    }

    const reviewNote =
      typeof body?.reviewNote === "string" ? body.reviewNote.trim().slice(0, 2000) : "";
    const status =
      action === "approve" ? "approved" : action === "retake" ? "retake" : "rejected";
    const now = new Date();
    const update: Record<string, any> = {
      $set: {
        status,
        reviewNote,
        reviewedBy: admin.id,
        reviewedAt: now,
        updatedAt: now,
      },
    };
    if (action === "retake") {
      update.$inc = { attempt: 1 };
      update.$unset = { submittedAt: "" };
    }

    await db
      .collection(ONBOARDING_COLLECTION)
      .updateOne({ _id: new ObjectId(id) }, update);

    const userId = String(submission.userId || "");
    const title =
      action === "approve"
        ? "Onboarding & induction approved"
        : action === "retake"
          ? "Onboarding & induction retake required"
          : "Onboarding & induction review";
    const bodyText =
      action === "approve"
        ? "Your onboarding and induction has been approved."
        : action === "retake"
          ? reviewNote
            ? `Please retake your onboarding and induction: ${reviewNote}`
            : "Please review your onboarding and induction and submit it again."
          : reviewNote
            ? `Your onboarding and induction needs attention: ${reviewNote}`
            : "Your onboarding and induction was not approved yet. Please review and resubmit.";

    await createNotification(db, userId, {
      type: "onboarding_induction",
      title,
      body: bodyText,
      data: { submissionId: id, status },
    });
    const tokens = await getUserPushTokens(db, userId);
    await sendPushNotifications(tokens, title, bodyText);

    const updated = await db
      .collection(ONBOARDING_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
    return NextResponse.json({
      data: updated ? serializeOnboarding(updated) : null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to review submission" }, { status: 500 });
  }
}
