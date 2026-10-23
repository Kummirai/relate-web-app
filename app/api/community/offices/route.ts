import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession, requireAdmin, ensureIndexes } from "@/lib/community-auth";
import {
  VOLUNTEER_OFFICES_COLLECTION,
  OFFICE_APPLICATIONS_COLLECTION,
  normalizeArea,
  parseBullets,
  serializeOffice,
} from "@/lib/volunteer-offices";
import { notifyAllUsers } from "@/lib/inapp-notify";
import { getAllPushTokens, sendPushNotifications } from "@/lib/push";

/**
 * Volunteer offices — open positions admins post for members to fill.
 *
 *  - GET: signed-in list. Members see open + filled offices (closed are
 *    hidden); admins see everything. Each row carries `myApplication`.
 *  - POST: admin-only. Posts an office and notifies every member.
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    await ensureIndexes(db);
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in to view" }, { status: 401 });
    }
    const admin = await requireAdmin(request);

    const query: Record<string, unknown> = admin
      ? {}
      : { status: { $in: ["open", "filled"] } };

    const [offices, myApps] = await Promise.all([
      db
        .collection(VOLUNTEER_OFFICES_COLLECTION)
        .find(query)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray(),
      db
        .collection(OFFICE_APPLICATIONS_COLLECTION)
        .find({ userId: user.id })
        .sort({ createdAt: -1 })
        .toArray(),
    ]);

    const appByOffice = new Map<string, any>();
    for (const a of myApps) {
      const key = String(a.officeId);
      if (!appByOffice.has(key)) appByOffice.set(key, a);
    }

    return NextResponse.json({
      data: offices.map((o: any) => ({
        ...serializeOffice(o),
        myApplication: appByOffice.get(o._id.toString()) || null,
      })),
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    await ensureIndexes(db);
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const area = normalizeArea(body.area);
    const clubSlug =
      typeof body.clubSlug === "string" && body.clubSlug.trim()
        ? body.clubSlug.trim()
        : null;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 },
      );
    }

    const now = new Date();
    const doc = {
      title,
      description,
      area,
      clubSlug,
      responsibilities: parseBullets(body.responsibilities),
      qualifications: parseBullets(body.qualifications),
      applicationQuestions: parseBullets(body.applicationQuestions),
      postedById: admin.id,
      postedByName: admin.name || "Admin",
      status: "open",
      createdAt: now,
      updatedAt: now,
    };
    const result = await db.collection(VOLUNTEER_OFFICES_COLLECTION).insertOne(doc);

    const itemId = result.insertedId.toString();
    const titleText = "A volunteer office is open";
    const bodyText = `${title} is open — apply before it's filled.`;
    const data = { section: "offices", itemId };
    await Promise.all([
      notifyAllUsers(
        db,
        { type: "office_posted", title: titleText, body: bodyText, data },
        admin.id,
      ),
      sendPushNotifications(await getAllPushTokens(db, admin.id), titleText, bodyText, data),
    ]);

    return NextResponse.json(
      { data: serializeOffice({ ...doc, _id: result.insertedId, myApplication: null }) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to post office" }, { status: 500 });
  }
}
