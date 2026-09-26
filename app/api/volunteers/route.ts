import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { notifyAdmins } from "@/lib/inapp-notify";
import { getAdminPushTokens, sendPushNotifications } from "@/lib/push";
import {
  VOLUNTEER_COLLECTION,
  ensureVolunteerIndexes,
  serializeVolunteer,
  type VolunteerStatus,
} from "@/lib/volunteers";

/**
 * Volunteer applications — the public intake behind the /volunteer form.
 *
 *  POST: anyone can apply (the volunteer page is a marketing surface, so we
 *    don't force an account). Creates or refreshes an open application for
 *    that email address and notifies admins.
 *
 * Admin reads live at /api/admin/volunteers.
 */

function str(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  try {
    // Read the body before any auth helper touches the request stream.
    const body = await request.json().catch(() => ({}));

    const name = str(body.name, 120);
    const email = str(body.email, 160).toLowerCase();
    const phone = str(body.phone, 40);
    const area = str(body.area, 120);
    const ageGroup = str(body.ageGroup, 60);
    const about = str(body.about, 4000);
    const availability = str(body.availability, 200);
    const areas = Array.isArray(body.areas)
      ? body.areas.map((a: unknown) => str(a, 80)).filter(Boolean).slice(0, 12)
      : [];

    if (!name) {
      return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }
    if (!phone) {
      return NextResponse.json(
        { error: "Please add a WhatsApp number so we can reach you." },
        { status: 400 },
      );
    }
    if (areas.length === 0) {
      return NextResponse.json(
        { error: "Please choose at least one area you would like to serve in." },
        { status: 400 },
      );
    }
    if (about.length < 20) {
      return NextResponse.json(
        { error: "Please tell us a little more about yourself (at least 20 characters)." },
        { status: 400 },
      );
    }

    const db = await getDb();
    await ensureVolunteerIndexes(db);
    const col = db.collection(VOLUNTEER_COLLECTION);

    // One open application per email — a re-apply refreshes the existing one.
    const existing = await col.findOne({
      email,
      status: { $nin: ["active", "declined"] },
    });

    const doc = {
      name,
      email,
      phone,
      area,
      ageGroup: ageGroup || null,
      areas,
      about,
      availability: availability || null,
      // Signed-in applicants get their account linked; guests do not.
      userId: (await resolveSession(request))?.id ?? null,
      status: "new" as VolunteerStatus,
      assignedTo: null as string | null,
      assignedToName: null as string | null,
      assignedAt: null as Date | null,
      adminNote: null as string | null,
      reviewedAt: null as Date | null,
      reviewedBy: null as string | null,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
      updatedCount: existing ? (existing.updatedCount ?? 1) + 1 : 1,
    };

    if (existing) {
      await col.updateOne({ _id: existing._id }, { $set: doc });
      return NextResponse.json(
        { data: serializeVolunteer({ ...doc, _id: existing._id }), updated: true },
        { status: 200 },
      );
    }

    const result = await col.insertOne(doc);
    const volunteerId = result.insertedId.toString();

    const title = "New volunteer request";
    const bodyText = `${name} applied to volunteer (${areas.slice(0, 3).join(", ")}).`;
    await Promise.all([
      notifyAdmins(
        db,
        { type: "volunteer_request", title, body: bodyText, data: { volunteerId } },
        doc.userId,
      ).catch((e) => console.error("[volunteers] notifyAdmins failed:", e)),
      getAdminPushTokens(db, doc.userId)
        .then((tokens) => sendPushNotifications(tokens, title, bodyText))
        .catch((e) => console.error("[volunteers] push to admins failed:", e)),
    ]);

    return NextResponse.json({ data: serializeVolunteer({ ...doc, _id: result.insertedId }) }, { status: 201 });
  } catch (e) {
    console.error("[volunteers] POST error:", e);
    return NextResponse.json(
      { error: "Could not submit your request. Please try again." },
      { status: 500 },
    );
  }
}
