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

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function payApprovedWorker(
  workerId: string,
  amount: number,
  serviceTitle: string,
  serviceId: string,
  db: any,
): Promise<string> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Smart Saver settlement is not configured");
  }
  const worker = await db.collection("user").findOne({
    $or: [{ id: workerId }, { _id: ObjectId.isValid(workerId) ? new ObjectId(workerId) : null }],
  });
  if (!worker?.email) throw new Error("The worker account has no email address");

  const authResponse = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(worker.email)}`,
    {
      headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
      cache: "no-store",
    },
  );
  if (!authResponse.ok) throw new Error("Could not find the worker in Smart Saver");
  const authResult = await authResponse.json();
  const authUser = (authResult.users ?? []).find(
    (user: any) =>
      user.email?.toLowerCase() === String(worker.email).toLowerCase(),
  );
  if (!authUser?.id) throw new Error("The worker has no linked Smart Saver account");

  const accountsUrl = new URL(`${SUPABASE_URL}/rest/v1/accounts`);
  accountsUrl.searchParams.set("select", "id");
  accountsUrl.searchParams.set("user_id", `eq.${authUser.id}`);
  accountsUrl.searchParams.set("account_type", "eq.relate");
  accountsUrl.searchParams.set("limit", "1");
  const accountsResponse = await fetch(accountsUrl, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    cache: "no-store",
  });
  if (!accountsResponse.ok) throw new Error("Could not load the Smart Saver account");
  const accounts = await accountsResponse.json();
  const accountId = accounts?.[0]?.id;
  if (!accountId) throw new Error("The worker has no Relate account in Smart Saver");

  const settlementResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/relate_settle_account`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_destination_account_id: accountId,
        p_amount: amount,
        p_description: `Service payment: ${serviceTitle} (${serviceId})`,
      }),
      cache: "no-store",
    },
  );
  if (!settlementResponse.ok) throw new Error("Smart Saver could not process the payment");
  return accountId;
}

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
      if (existing.payment?.status === "paid") {
        return NextResponse.json({ error: "Payment already made" }, { status: 409 });
      }
      const rewardAmount = Number(existing.rewardAmount);
      if (!existing.acceptedById || !Number.isFinite(rewardAmount) || rewardAmount <= 0) {
        return NextResponse.json(
          { error: "A worker and positive reward amount are required" },
          { status: 400 },
        );
      }
      let paymentAccountId: string;
      try {
        paymentAccountId = await payApprovedWorker(
          existing.acceptedById,
          rewardAmount,
          existing.title,
          id,
          db,
        );
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Payment could not be made" },
          { status: 502 },
        );
      }
      set.payment = {
        status: "paid",
        amount: rewardAmount,
        accountId: paymentAccountId,
        paidAt: now,
      };
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
          body: `${rewardAmount} was paid to your Smart Saver Relate account. Open Smart Saver to see your new balance.`,
        };
      }
} else if (action === "reopen") {
      const reviewNote =
        typeof body?.note === "string"
          ? body.note.trim()
          : null;

      if (existing.status === "closed") {
        // Fully fresh listing again — release any old claim.
        set.status = "open";
        set.acceptedById = null;
        set.acceptedByName = null;
        set.acceptedAt = null;
        set.submission = null;
        set.review = reviewNote
          ? { note: reviewNote, approved: false, reviewedBy: admin.id, reviewedAt: now }
          : null;
      } else if (existing.status === "submitted" || existing.status === "approved") {
        // Send it back — claim kept so the same member can revise with admin notes.
        set.status = "accepted";
        set.review = reviewNote
          ? { note: reviewNote, approved: false, reviewedBy: admin.id, reviewedAt: now }
          : { approved: false, reviewedBy: admin.id, reviewedAt: now };
        if (existing.status === "approved") set.submission = null;
      } else if (existing.status === "accepted") {
        set.status = "open";
        set.acceptedById = null;
        set.acceptedByName = null;
        set.acceptedAt = null;
        set.submission = null;
        set.review = reviewNote
          ? { note: reviewNote, approved: false, reviewedBy: admin.id, reviewedAt: now }
          : null;
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
