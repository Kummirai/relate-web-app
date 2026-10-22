import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import {
  CLUB_SERVICES_COLLECTION,
  validateSubmission,
  isHttpUrl,
  serializeService,
} from "@/lib/club-services";
import { notifyAdmins } from "@/lib/inapp-notify";
import { getAdminPushTokens, sendPushNotifications } from "@/lib/push";

/**
 * Submit completed work on a claimed service.
 *
 * Deliverable rules by type (see lib/club-services validateSubmission):
 *  - bug:   GitHub PR/commit link the admin can open and merge
 *  - design: rendered image (upload URL from the app)
 *  - other: either
 *
 * Notifies every admin (in-app + push) that a review is waiting, including
 * the GitHub link for bug fixes.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db
      .collection(CLUB_SERVICES_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    if (existing.acceptedById !== user.id) {
      return NextResponse.json(
        { error: "Accept this service before submitting work." },
        { status: 409 },
      );
    }
    if (existing.status === "submitted") {
      return NextResponse.json(
        { error: "Your submission is already under review." },
        { status: 409 },
      );
    }
    if (existing.status !== "accepted") {
      return NextResponse.json(
        { error: "This service is not accepting submissions." },
        { status: 409 },
      );
    }

    const body = await request.json();
    const note = typeof body.note === "string" ? body.note.trim() : "";
    const githubLink = isHttpUrl(body.githubLink) ? body.githubLink.trim() : null;
    const imageUrl = isHttpUrl(body.imageUrl) ? body.imageUrl.trim() : null;

    const invalid = validateSubmission(existing.type, { githubLink, imageUrl });
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }
    if (!note) {
      return NextResponse.json(
        { error: "Add a short note about what you delivered." },
        { status: 400 },
      );
    }

    const submission = { note, githubLink, imageUrl, submittedAt: new Date() };
    await db.collection(CLUB_SERVICES_COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "submitted", submission, updatedAt: new Date() } },
    );

    const titleText = "Service work submitted";
    const bodyText = `${user.name || "A member"} submitted work on "${existing.title}"${
      githubLink ? ` — review on GitHub: ${githubLink}` : "."
    }`;
    const data = { section: "services", itemId: id };
    await Promise.all([
      notifyAdmins(db, { type: "service_submitted", title: titleText, body: bodyText, data }, user.id),
      sendPushNotifications(await getAdminPushTokens(db, user.id), titleText, bodyText, data),
    ]);

    const updated = await db
      .collection(CLUB_SERVICES_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ data: serializeService(updated) });
  } catch {
    return NextResponse.json({ error: "Failed to submit work" }, { status: 500 });
  }
}
