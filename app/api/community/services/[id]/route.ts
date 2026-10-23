import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession, requireAdmin } from "@/lib/community-auth";
import {
  CLUB_SERVICES_COLLECTION,
  SERVICE_TYPES,
  parseDueDate,
  type ServiceType,
  serializeService,
} from "@/lib/club-services";
import { createNotification } from "@/lib/inapp-notify";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";

/**
 * One service.
 *
 *  - GET: detail for signed-in members.
 *  - PATCH: admin only. Either edits fields, or runs a review action:
 *      approve — submitted work is accepted (notifies the claimer)
 *      reopen  — release the claim back to open (notifies the claimer)
 *      close   — retire the service (notifies the claimer if there is one)
 */
export async function GET(
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
      return NextResponse.json({ error: "Sign in to view" }, { status: 401 });
    }
    const doc = await db
      .collection(CLUB_SERVICES_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    return NextResponse.json({
      data: {
        ...serializeService(doc),
        isClaimedByMe: doc.acceptedById === user.id,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load service" }, { status: 500 });
  }
}

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
      .collection(CLUB_SERVICES_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const body = await request.json();
    const action = typeof body.action === "string" ? body.action : null;
    const now = new Date();
    const set: Record<string, any> = { updatedAt: now };

    // Field edits (any subset).
    if (typeof body.title === "string" && body.title.trim()) set.title = body.title.trim();
    if (typeof body.description === "string" && body.description.trim()) {
      set.description = body.description.trim();
    }
    if (SERVICE_TYPES.includes(body.type as ServiceType)) set.type = body.type;
    if (body.dueDate !== undefined) set.dueDate = parseDueDate(body.dueDate);
    if (body.clubSlug !== undefined) {
      set.clubSlug =
        typeof body.clubSlug === "string" && body.clubSlug.trim()
          ? body.clubSlug.trim()
          : null;
    }

    let notifyClaimer: { title: string; body: string } | null = null;

    if (action === "approve") {
      if (existing.status !== "submitted") {
        return NextResponse.json(
          { error: "Only submitted work can be approved" },
          { status: 409 },
        );
      }
      set.status = "approved";
      set.review = {
        approved: true,
        note: typeof body.note === "string" ? body.note.trim() || null : null,
        reviewedBy: admin.id,
        reviewedAt: now,
      };
      if (existing.acceptedById) {
        notifyClaimer = {
          title: "Service approved",
          body: `Your work on "${existing.title}" was approved.`,
        };
      }
    } else if (action === "reopen") {
      if (existing.status === "closed") {
        // Fully fresh listing again — release any old claim.
        set.status = "open";
        set.acceptedById = null;
        set.acceptedByName = null;
        set.acceptedAt = null;
        set.submission = null;
        set.review = null;
      } else if (existing.status === "submitted" || existing.status === "approved") {
        // Send it back — claim kept so the same member can revise.
        set.status = "accepted";
        set.review = null;
        if (existing.status === "approved") set.submission = null;
      } else if (existing.status === "accepted") {
        set.status = "open";
        set.acceptedById = null;
        set.acceptedByName = null;
        set.acceptedAt = null;
        set.submission = null;
      }
      if (existing.acceptedById && existing.status !== "open") {
        notifyClaimer = {
          title: "Service updated",
          body: `"${existing.title}" was reopened — check what's needed.`,
        };
      }
    } else if (action === "close") {
      set.status = "closed";
      if (existing.acceptedById && existing.status !== "closed") {
        notifyClaimer = {
          title: "Service closed",
          body: `"${existing.title}" is no longer taking work.`,
        };
      }
    } else if (action) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await db
      .collection(CLUB_SERVICES_COLLECTION)
      .updateOne({ _id: new ObjectId(id) }, { $set: set });

    if (notifyClaimer && existing.acceptedById && existing.acceptedById !== admin.id) {
      const data = { section: "services", itemId: id };
      await Promise.all([
        createNotification(db, existing.acceptedById, {
          type: "service_status",
          title: notifyClaimer.title,
          body: notifyClaimer.body,
          data,
        }),
        sendPushNotifications(
          await getUserPushTokens(db, existing.acceptedById),
          notifyClaimer.title,
          notifyClaimer.body,
          data,
        ),
      ]);
    }

    const updated = await db
      .collection(CLUB_SERVICES_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ data: serializeService(updated) });
  } catch {
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}
