import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { resolveSession, requireAdmin } from "@/lib/community-auth";
import { parseFee } from "@/lib/fees";

/**
 * Event payment recording + approval.
 *
 * Access:
 *  - Attendees may record payments on their own registration (always targeted
 *    at the signed-in session user; the client-supplied userId is ignored).
 *    Self-recorded payments are created as PENDING until the owner approves.
 *  - The event owner / admins may record payments (approved immediately) for
 *    any attendee, approve or reject pending payments, and settle balances.
 *
 * POST — record a payment toward the fee:
 *   { userId, amount, popUrl?, note? }   amount > 0 in the event's currency.
 *   { userId, paid: true }               convenience shortcut: pay the full
 *                                        remaining balance in one entry.
 *
 * PUT  — approve or reject a pending payment entry:
 *   { userId, paymentId, approve: boolean }
 *
 * A "bringing partner" doubles the amount due for that registration, and the
 * ledger is the source of truth (amountPaid/pendingAmount are recomputed from
 * it after every mutation).
 */

type RegDoc = {
  payments?: any[];
  amountPaid?: number;
  pendingAmount?: number;
  popUrl?: string | null;
  paidAt?: string | null;
  markedPaidBy?: string | null;
  bringingPartner?: boolean;
};

async function recomputePaymentState(
  db: any,
  eventId: ObjectId,
  userId: string,
  totalDue: number,
): Promise<{ amountPaid: number; pendingAmount: number; paid: boolean; remaining: number }> {
  const reg = (await db
    .collection("event_registrations")
    .findOne({ eventId, userId })) as RegDoc | null;
  if (!reg) return { amountPaid: 0, pendingAmount: 0, paid: true, remaining: 0 };

  const payments = Array.isArray(reg.payments) ? reg.payments : [];
  if (payments.length > 0) {
    const approved = payments.filter((p) => p?.status === "approved" || !p?.status);
    const pending = payments.filter((p) => p?.status === "pending");
    const amountPaid = approved.reduce((s, p) => s + (p.amount || 0), 0);
    const pendingAmount = pending.reduce((s, p) => s + (p.amount || 0), 0);
    const paid = totalDue <= 0 || amountPaid >= totalDue;
    const lastApproved = approved[approved.length - 1];
    await db.collection("event_registrations").updateOne(
      { eventId, userId },
      {
        $set: {
          amountPaid,
          pendingAmount,
          paid,
          popUrl: lastApproved?.popUrl ?? reg.popUrl ?? null,
          paidAt: lastApproved?.paidAt ?? reg.paidAt ?? null,
          markedPaidBy: lastApproved?.recordedBy ?? reg.markedPaidBy ?? null,
          updatedAt: new Date(),
        },
      },
    );
    return {
      amountPaid,
      pendingAmount,
      paid,
      remaining: Math.max(0, totalDue - amountPaid),
    };
  }

  // Legacy registrations created before the ledger existed.
  const amountPaid = reg.amountPaid || 0;
  const pendingAmount = reg.pendingAmount || 0;
  return {
    amountPaid,
    pendingAmount,
    paid: totalDue <= 0 || amountPaid >= totalDue,
    remaining: Math.max(0, totalDue - amountPaid),
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const event = await db
      .collection("community_events")
      .findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isAdmin = !!(await requireAdmin(request));
    const isOwner =
      event.userId === user.id ||
      (!event.userId && !!user.name && event.author === user.name);
    const manager = isAdmin || isOwner;

    const body = await request.json().catch(() => ({}));

    // Attendees can only pay for themselves — use the session id, never a
    // client-supplied one (which may be missing/mismatched and caused 403s).
    const targetUserId = manager ? String(body.userId || "") : user.id;
    if (!targetUserId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const fee = parseFee(event.fee);
    const reg = (await db.collection("event_registrations").findOne({
      eventId: new ObjectId(id),
      userId: targetUserId,
    })) as RegDoc | null;
    const totalDue = fee.amount * (reg?.bringingPartner ? 2 : 1);
    const amountPaid = reg?.amountPaid || 0;
    const remaining = Math.max(0, totalDue - amountPaid);

    // { userId, paid: true } → settle the full remaining balance.
    let amount = parseFloat(String(body.amount ?? ""));
    if (body.paid === true && !Number.isFinite(amount)) {
      amount = remaining;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "A payment amount greater than zero is required" },
        { status: 400 },
      );
    }

    const entry = {
      _id: new ObjectId(),
      amount: Math.round(amount * 100) / 100,
      popUrl: body.popUrl ? String(body.popUrl).trim() : null,
      note: body.note ? String(body.note).trim() : null,
      paidAt: new Date().toISOString(),
      recordedBy: user.id,
      // Owner/admin-recorded payments count immediately; self-service
      // payments wait for the owner to approve the POP.
      status: manager ? "approved" : "pending",
    };

    await db.collection("event_registrations").updateOne(
      { eventId: new ObjectId(id), userId: targetUserId },
      {
        $setOnInsert: {
          eventId: new ObjectId(id),
          userId: targetUserId,
          feeAmount: fee.amount,
          feeSymbol: fee.symbol,
          createdAt: new Date(),
        },
        $push: { payments: entry },
      },
      { upsert: true },
    );

    const state = await recomputePaymentState(
      db,
      new ObjectId(id),
      targetUserId,
      totalDue,
    );
    return NextResponse.json({
      data: {
        userId: targetUserId,
        amount: entry.amount,
        status: entry.status,
        feeAmount: fee.amount,
        feeSymbol: fee.symbol,
        ...state,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const event = await db
      .collection("community_events")
      .findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isAdmin = !!(await requireAdmin(request));
    const isOwner =
      event.userId === user.id ||
      (!event.userId && !!user.name && event.author === user.name);
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetUserId = String(body.userId || "");
    const paymentId = String(body.paymentId || "");
    if (!targetUserId || !paymentId) {
      return NextResponse.json(
        { error: "userId and paymentId are required" },
        { status: 400 },
      );
    }

    const reg = (await db.collection("event_registrations").findOne({
      eventId: new ObjectId(id),
      userId: targetUserId,
    })) as RegDoc | null;
    if (!reg) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 },
      );
    }

    const payments = Array.isArray(reg.payments) ? reg.payments : [];
    const entry = payments.find((p) => p?._id && p._id.toString() === paymentId);
    if (!entry) {
      return NextResponse.json(
        { error: "Payment entry not found" },
        { status: 404 },
      );
    }
    if (entry.status === "approved") {
      return NextResponse.json(
        { error: "This payment is already approved" },
        { status: 400 },
      );
    }

    const approve = !!body.approve;
    if (approve) {
      await db.collection("event_registrations").updateOne(
        {
          eventId: new ObjectId(id),
          userId: targetUserId,
          "payments._id": entry._id,
        },
        { $set: { "payments.$.status": "approved" } },
      );
    } else {
      await db.collection("event_registrations").updateOne(
        { eventId: new ObjectId(id), userId: targetUserId },
        { $pull: { payments: { _id: entry._id } } },
      );
    }

    const fee = parseFee(event.fee);
    const totalDue = fee.amount * (reg.bringingPartner ? 2 : 1);
    const state = await recomputePaymentState(
      db,
      new ObjectId(id),
      targetUserId,
      totalDue,
    );
    return NextResponse.json({
      data: { userId: targetUserId, paymentId, approve, ...state },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 },
    );
  }
}
