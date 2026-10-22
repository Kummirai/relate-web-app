import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession, requireAdmin, ensureIndexes } from "@/lib/community-auth";
import {
  CLUB_SERVICES_COLLECTION,
  SERVICE_TYPES,
  type ServiceType,
  serializeService,
} from "@/lib/club-services";
import { notifyAllUsers } from "@/lib/inapp-notify";
import { getAllPushTokens, sendPushNotifications } from "@/lib/push";

/**
 * Club services (the member services marketplace).
 *
 *  - GET: signed-in list. `?status=` filters, `?mine=1` returns only the
 *    services the caller has claimed. Rows carry `isClaimedByMe`.
 *  - POST: admin-only. Posts a new service and notifies every member
 *    (in-app + push) so they can claim it.
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    await ensureIndexes(db);
    const user = await resolveSession(request);
    const userId = user?.id || null;

    const params = request.nextUrl.searchParams;
    const status = params.get("status");
    const mine = params.get("mine") === "1";

    const query: Record<string, unknown> = {};
    if (mine) {
      query.acceptedById = userId;
    } else if (status) {
      query.status = status;
    }

    const services = await db
      .collection(CLUB_SERVICES_COLLECTION)
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      data: services.map((s: any) => ({
        ...serializeService(s),
        isClaimedByMe: !!userId && s.acceptedById === userId,
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
    const type: ServiceType = SERVICE_TYPES.includes(body.type)
      ? body.type
      : "other";
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
      type,
      clubSlug,
      posterId: admin.id,
      posterName: admin.name || "Admin",
      status: "open",
      acceptedById: null,
      acceptedByName: null,
      acceptedAt: null,
      submission: null,
      review: null,
      createdAt: now,
      updatedAt: now,
    };
    const result = await db
      .collection(CLUB_SERVICES_COLLECTION)
      .insertOne(doc);

    const itemId = result.insertedId.toString();
    const titleText = "New service posted";
    const bodyText = `${doc.posterName} posted a service — ${title}`;
    const data = { section: "services", itemId };
    await Promise.all([
      notifyAllUsers(
        db,
        { type: "service_posted", title: titleText, body: bodyText, data },
        admin.id,
      ),
      sendPushNotifications(await getAllPushTokens(db, admin.id), titleText, bodyText, data),
    ]);

    return NextResponse.json(
      { data: serializeService({ ...doc, _id: result.insertedId }) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to post service" },
      { status: 500 },
    );
  }
}
