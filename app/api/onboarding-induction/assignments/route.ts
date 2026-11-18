import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { findUserById, requireAdmin } from "@/lib/community-auth";
import { createNotification } from "@/lib/inapp-notify";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";
import {
  ONBOARDING_COLLECTION,
  emptyAnswers,
  isApproverEmail,
  sanitizeDate,
  serializeOnboarding,
} from "@/lib/onboarding-induction";

export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const targetId = String(body?.userId || "");
    const startDate = sanitizeDate(body?.startDate);
    const dueDate = sanitizeDate(body?.dueDate);
    if (!targetId || !startDate || !dueDate) {
      return NextResponse.json(
        { error: "userId, startDate and dueDate (YYYY-MM-DD) are required" },
        { status: 400 },
      );
    }
    if (startDate > dueDate) {
      return NextResponse.json(
        { error: "startDate must be on or before dueDate" },
        { status: 400 },
      );
    }

    const target = await findUserById(db, targetId);
    if (!target || target.role !== "admin") {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    const now = new Date();
    await db.collection(ONBOARDING_COLLECTION).updateOne(
      { userId: targetId },
      {
        $set: {
          userId: targetId,
          userName: String(target.name || ""),
          userEmail: String(target.email || ""),
          startDate,
          dueDate,
          assignedBy: admin.id,
          assignedAt: now,
          status: "assigned",
          answers: emptyAnswers(),
          updatedAt: now,
        },
        $unset: {
          submittedAt: "",
          reviewNote: "",
          reviewedBy: "",
          reviewedAt: "",
        },
        $setOnInsert: { createdAt: now, attempt: 0 },
      },
      { upsert: true },
    );

    const submission = await db
      .collection(ONBOARDING_COLLECTION)
      .findOne({ userId: targetId });
    const title = "Onboarding & induction assigned";
    const bodyText = `Your onboarding window is ${startDate.toISOString().slice(0, 10)} to ${dueDate.toISOString().slice(0, 10)}.`;
    const notificationData = {
      route: "/onboarding-induction",
      action: "form",
      submissionId: String(submission?._id || ""),
      startDate: startDate.toISOString().slice(0, 10),
      dueDate: dueDate.toISOString().slice(0, 10),
    };
    try {
      await createNotification(db, targetId, {
        type: "onboarding_induction",
        title,
        body: bodyText,
        data: notificationData,
      });
      if (targetId !== admin.id) {
        const tokens = await getUserPushTokens(db, targetId);
        await sendPushNotifications(tokens, title, bodyText, notificationData);
      }
    } catch (error) {
      console.error("[onboarding] assignment notification failed", error);
    }

    return NextResponse.json({
      data: submission ? serializeOnboarding(submission) : null,
    });
  } catch (error) {
    console.error("[onboarding] assignment failed", error);
    return NextResponse.json({ error: "Failed to assign onboarding" }, { status: 500 });
  }
}
