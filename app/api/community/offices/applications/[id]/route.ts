import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import {
  OFFICE_APPLICATIONS_COLLECTION,
  VOLUNTEER_OFFICES_COLLECTION,
  serializeApplication,
} from "@/lib/volunteer-offices";
import { createNotification } from "@/lib/inapp-notify";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";

/**
 * Review one office application.
 *
 *  - approve → application approved AND the office becomes filled
 *  - reject  → application declined (the office stays open)
 *
 * The applicant is notified in both cases.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const db = await getDb();
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db
      .collection(OFFICE_APPLICATIONS_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const body = await request.json();
    const action = typeof body.action === "string" ? body.action : "";
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 },
      );
    }

    const now = new Date();
    const status = action === "approve" ? "approved" : "rejected";
    const reviewNote =
      typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;

    await db.collection(OFFICE_APPLICATIONS_COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, reviewNote, reviewedAt: now, reviewedBy: admin.id } },
    );

    // Approving fills the office; other pending applications keep their state
    // so the admin can still reject or re-route them.
    if (action === "approve") {
      await db.collection(VOLUNTEER_OFFICES_COLLECTION).updateOne(
        { _id: new ObjectId(existing.officeId) },
        { $set: { status: "filled", updatedAt: now } },
      );
    }

    const titleText =
      action === "approve" ? "Office application approved" : "Office application update";
    const bodyText =
      action === "approve"
        ? `You were approved for "${existing.officeTitle}".`
        : `Your application for "${existing.officeTitle}" wasn't approved.`;
    const data = { section: "offices", itemId: String(existing.officeId) };
    if (existing.userId && existing.userId !== admin.id) {
      await Promise.all([
        createNotification(db, existing.userId, {
          type:
            action === "approve"
              ? "office_application_approved"
              : "office_application_rejected",
          title: titleText,
          body: bodyText,
          data,
        }),
        sendPushNotifications(
          await getUserPushTokens(db, existing.userId),
          titleText,
          bodyText,
          data,
        ),
      ]);
    }

    const updated = await db
      .collection(OFFICE_APPLICATIONS_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ data: serializeApplication(updated) });
  } catch {
    return NextResponse.json({ error: "Failed to review application" }, { status: 500 });
  }
}
