import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { resolveSession, requireAdmin } from "@/lib/community-auth";
import { parseFee } from "@/lib/fees";

/**
 * Event payment recording.
 *
 * Access: the attendee themselves, the event owner, or an admin.
 *
 * POST — record a payment toward the fee:
 *   { userId, amount, popUrl?, note? }   amount > 0 in the event's currency.
 *   { userId, paid: true }               convenience shortcut: pay the full
 *                                        remaining balance in one entry.
 *
 * Each recorded payment is appended to the registration's `payments` ledger
 * (amount + optional proof-of-payment image URL + who recorded it). The POP
 * image bytes are uploaded client-side to storage; only the URL is persisted.
 */
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

    const body = await request.json().catch(() => ({}));
    const targetUserId = String(body.userId || "");
    if (!targetUserId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // Attendees may only record payments on their own registration.
    const isSelf = targetUserId === user.id;
    if (!isAdmin && !isOwner && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const fee = parseFee(event.fee);
    const reg = await db.collection("event_registrations").findOne({
      eventId: new ObjectId(id),
      userId: targetUserId,
    });
    const amountPaid = reg?.amountPaid || 0;
    const remaining = Math.max(0, fee.amount - amountPaid);

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
      amount: Math.round(amount * 100) / 100,
      popUrl: body.popUrl ? String(body.popUrl).trim() : null,
      note: body.note ? String(body.note).trim() : null,
      paidAt: new Date().toISOString(),
      recordedBy: user.id,
    };
    const newAmountPaid = Math.round((amountPaid + amount) * 100) / 100;
    const fullyPaid = newAmountPaid >= fee.amount;

    await db.collection("event_registrations").updateOne(
      { eventId: new ObjectId(id), userId: targetUserId },
      {
        $inc: { amountPaid: entry.amount },
        $push: { payments: entry },
        $set: {
          paid: fullyPaid,
          popUrl: entry.popUrl ?? reg?.popUrl ?? null,
          paidAt: fullyPaid ? entry.paidAt : reg?.paidAt ?? null,
          markedPaidBy: fullyPaid ? user.id : reg?.markedPaidBy ?? null,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    const newRemaining = Math.max(0, fee.amount - newAmountPaid);
    return NextResponse.json({
      data: {
        userId: targetUserId,
        amount: entry.amount,
        amountPaid: newAmountPaid,
        remaining: newRemaining,
        feeAmount: fee.amount,
        feeSymbol: fee.symbol,
        paid: newRemaining <= 0,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 },
    );
  }
}
