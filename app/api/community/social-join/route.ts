import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession, requireAdmin, ensureIndexes } from "@/lib/community-auth";
import { notifyAdmins } from "@/lib/inapp-notify";
import { getAdminPushTokens, sendPushNotifications } from "@/lib/push";

/**
 * Social join — WhatsApp community questionnaire.
 *
 *  - POST: signed-in user submits answers (creates pending request).
 *    Notifies all admins (push + in-app) as fire-and-forget.
 *  - GET: if admin with ?status=... returns filtered list; otherwise
 *    returns the caller's own submission (or null).
 */
export async function POST(request: NextRequest) {
  try {
    // Parse body FIRST — resolveSession / auth.api.getSession may consume the
    // request stream on some Next.js App Router versions.
    const rawBody = await request.json();
    const relationship = typeof rawBody.relationship === "string" ? rawBody.relationship.trim() : "";
    const skill = typeof rawBody.skill === "string" ? rawBody.skill.trim() : "";
    const source = typeof rawBody.source === "string" ? rawBody.source.trim() : "";
    const ageRange = typeof rawBody.ageRange === "string" ? rawBody.ageRange.trim() : "";
    const phone = typeof rawBody.phone === "string" ? rawBody.phone.trim() : "";
    const countryCode = typeof rawBody.countryCode === "string" ? rawBody.countryCode.trim() : "";
    const gender = typeof rawBody.gender === "string" ? rawBody.gender.trim() : "";

    if (!relationship || !skill || !source || !ageRange || !phone || !gender) {
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

    const db = await getDb();
    await ensureIndexes(db);

    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in to join" }, { status: 401 });
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
      phone: phone || null,
      countryCode: countryCode || "+27",
      gender: gender || null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
    };

    const result = await db.collection("community_social_joins").insertOne(doc);

    // Await notifications — Vercel freezes un-awaited promises after the
    // response is flushed, so fire-and-forget never executes on serverless.
    const title = "New community join request";
    const bodyText = `${doc.name} wants to join the WhatsApp community (${relationship}).`;
    const joinId = result.insertedId.toString();
    await Promise.all([
      notifyAdmins(
        db,
        { type: "social_join", title, body: bodyText, data: { joinId } },
        uid,
      ).catch((e) => console.error("[social-join] notifyAdmins failed:", e)),
      getAdminPushTokens(db, uid)
        .then((tokens) => sendPushNotifications(tokens, title, bodyText))
        .catch((e) => console.error("[social-join] push to admins failed:", e)),
    ]);

    return NextResponse.json(
      { data: { ...doc, _id: joinId } },
      { status: 201 },
    );
  } catch (e) {
    console.error("[social-join] POST error:", e);
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

      // The dashboard sidebar polls for a pending-queue badge; countOnly skips
      // the find and returns just the total.
      if (request.nextUrl.searchParams.get("countOnly") === "1") {
        const count = await db
          .collection("community_social_joins")
          .countDocuments(query);
        return NextResponse.json({ count });
      }

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
  } catch (e) {
    console.error("[social-join] GET error:", e);
    return NextResponse.json({ data: null });
  }
}
