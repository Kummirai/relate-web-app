import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";
import { createNotification } from "@/lib/inapp-notify";

const APPROVED_STATUSES = ["approved", "rejected"] as const;

/**
 * Admin review of a sponsorship pledge.
 *
 *  - PATCH: approve or reject a pending pledge. Sets the review fields and
 *    notifies the sponsor (push + in-app) of the outcome.
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
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const doc = await db
      .collection("sponsorships")
      .findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json({ error: "Sponsorship not found" }, { status: 404 });
    }
    if (APPROVED_STATUSES.includes(doc.status)) {
      return NextResponse.json(
        { error: `Sponsorship has already been ${doc.status}` },
        { status: 409 },
      );
    }

    const status = action === "approve" ? "approved" : "rejected";
    const now = new Date();
    await db.collection("sponsorships").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, reviewedAt: now, reviewedBy: admin.id, updatedAt: now } },
    );

    // Awaited so Vercel doesn't freeze the function before Expo delivery.
    if (doc.userId) {
      try {
        const kind = action === "approve" ? "approved" : "rejected";
        const title =
          action === "approve" ? "Sponsorship approved" : "Sponsorship not approved";
        const body =
          action === "approve"
            ? `Your pledge of R ${Number(doc.amount).toLocaleString("en-US")} was approved. Thank you!`
            : `Your pledge of R ${Number(doc.amount).toLocaleString("en-US")} could not be approved. Please reach out if you have questions.`;
        await sendPushNotifications(
          await getUserPushTokens(db, doc.userId),
          title,
          body,
          { type: `sponsorship_${kind}`, sponsorId: doc.sponsorId, sponsorshipId: id },
        );
        await createNotification(db, doc.userId, {
          type: `sponsorship_${kind}`,
          title,
          body,
          data: { sponsorId: doc.sponsorId, sponsorshipId: id },
        });
      } catch {}
    }

    return NextResponse.json({
      data: { _id: id, status, reviewedAt: now, reviewedBy: admin.id },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to review sponsorship" },
      { status: 500 },
    );
  }
}
