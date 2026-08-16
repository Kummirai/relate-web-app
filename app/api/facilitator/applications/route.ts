import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  requireAdmin,
  resolveSession,
  findUserById,
} from "@/lib/community-auth";
import { notifyAdmins } from "@/lib/inapp-notify";
import { getAdminPushTokens, sendPushNotifications } from "@/lib/push";

/**
 * Facilitator applications.
 *
 *  - POST: a signed-in user applies to become a facilitator (pending).
 *    Notifies every admin (push + in-app) so the application can be reviewed.
 *  - GET: admin-only list, optionally filtered by status.
 */
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in to apply" }, { status: 401 });
    }

    const userDoc = await findUserById(db, user.id);
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (userDoc.role === "facilitator" || userDoc.role === "admin") {
      return NextResponse.json(
        { error: "You are already a facilitator." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const motivation =
      typeof body.motivation === "string" ? body.motivation.trim() : "";

    const uid = userDoc.id || userDoc._id?.toString() || "";
    const existing = await db.collection("facilitator_applications").findOne({
      userId: uid,
      status: { $in: ["pending", "approved"] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have an application under review." },
        { status: 409 },
      );
    }

    const doc = {
      userId: uid,
      name: userDoc.name || "Unknown",
      email: userDoc.email || null,
      motivation,
      status: "pending",
      createdAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      trainedAt: null,
    };
    const result = await db.collection("facilitator_applications").insertOne(doc);

    const title = "New facilitator application";
    const bodyText = `${doc.name} wants to become a facilitator.`;
    await notifyAdmins(
      db,
      {
        type: "facilitator_application",
        title,
        body: bodyText,
        data: { applicationId: result.insertedId.toString() },
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
      { error: "Failed to submit application" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const status = request.nextUrl.searchParams.get("status");
    const query: Record<string, string> = {};
    if (status) query.status = status;
    const apps = await db
      .collection("facilitator_applications")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();
    return NextResponse.json({
      data: apps.map((a: any) => ({ ...a, _id: a._id.toString() })),
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
