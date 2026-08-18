import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession, requireAdmin, ensureIndexes } from "@/lib/community-auth";
import { notifyAdmins } from "@/lib/inapp-notify";
import { getAdminPushTokens, sendPushNotifications } from "@/lib/push";

/**
 * Social join — WhatsApp community questionnaire.
 *
 *  - POST: signed-in user submits answers (creates pending request).
 *    Notifies all admins (push + in-app).
 *  - GET: if admin with ?status=... returns filtered list; otherwise
 *    returns the caller's own submission (or null).
 */
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    await ensureIndexes(db);
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in to join" }, { status: 401 });
    }

    const body = await request.json();
    const relationship = typeof body.relationship === "string" ? body.relationship.trim() : "";
    const skill = typeof body.skill === "string" ? body.skill.trim() : "";
    const source = typeof body.source === "string" ? body.source.trim() : "";
    const ageRange = typeof body.ageRange === "string" ? body.ageRange.trim() : "";

    if (!relationship || !skill || !source || !ageRange) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    const validRelationships = ["single", "married", "in_a_relationship"];
    if (!validRelationships.includes(relationship)) {
      return NextResponse.json(
        { error: "Invalid relationship status" },
        { status: 400 },
      );
    }

    const uid = user.id;

    // Prevent duplicate pending submissions
    const existing = await db.collection("community_social_joins").findOne({
      userId: uid,
      status: "pending",
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a request under review." },
        { status: 409 },
      );
    }

    const doc = {
      userId: uid,
      name: user.name || "Unknown",
      relationship,
      skill,
      source,
      ageRange,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
    };

    const result = await db.collection("community_social_joins").insertOne(doc);

    // Notify admins
    const title = "New community join request";
    const bodyText = `${doc.name} wants to join the WhatsApp community (${relationship}).`;
    await notifyAdmins(
      db,
      {
        type: "social_join",
        title,
        body: bodyText,
        data: { joinId: result.insertedId.toString() },
      },
      uid,
    );
    const tokens = await getAdminPushTokens(db, uid);
    await sendPushNotifications(tokens, title, bodyText);

    return NextResponse.json(
      { data: { ...doc, _id: result.insertedId.toString() } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    await ensureIndexes(db);

    const admin = await requireAdmin(request);
    const status = request.nextUrl.searchParams.get("status");

    if (admin) {
      // Admin: list all (optionally filtered by status)
      const query: Record<string, string> = {};
      if (status) query.status = status;
      const joins = await db
        .collection("community_social_joins")
        .find(query)
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();
      return NextResponse.json({
        data: joins.map((j: any) => ({ ...j, _id: j._id.toString() })),
      });
    }

    // Non-admin: return own submission only
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ data: null });
    }
    const mine = await db
      .collection("community_social_joins")
      .findOne({ userId: user.id }, { sort: { createdAt: -1 } });
    if (!mine) return NextResponse.json({ data: null });
    return NextResponse.json({
      data: { ...mine, _id: mine._id.toString() },
    });
  } catch {
    return NextResponse.json({ data: null });
  }
}
