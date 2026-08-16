import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  fetchParticipants,
  resolveAdminOrOwner,
} from "@/lib/community-auth";
import { parseFee } from "@/lib/fees";

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

    const event = await db.collection("community_events").findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const access = await resolveAdminOrOwner(request, {
      userId: event.userId,
      author: event.author,
    });
    if (!access) {
      return NextResponse.json(
        { error: "Only the event owner or an admin can view registrations" },
        { status: 403 },
      );
    }

    const userIds = event.rsvpUserIds || [];
    const participants = await fetchParticipants(db, userIds);

    // Full registration details are stored in event_registrations (booking form).
    const registrations = userIds.length
      ? await db
          .collection("event_registrations")
          .find({ eventId: new ObjectId(id) })
          .sort({ createdAt: -1 })
          .toArray()
      : [];
    const regByUser = new Map<string, any>();
    for (const r of registrations) {
      if (r.userId && !regByUser.has(r.userId)) regByUser.set(r.userId, r);
    }

    const data = userIds.map((uid: string) => {
      const base = participants.get(uid);
      const reg = regByUser.get(uid);
      const fee = parseFee(event.fee);
      const amountPaid = reg?.amountPaid || 0;
      const remaining = Math.max(0, fee.amount - amountPaid);
      const paid = fee.amount === 0 || remaining <= 0;
      return {
        id: uid,
        name: base?.name || "Anonymous",
        email: base?.email || "",
        image: base?.image || null,
        // Booking-form details (admin/owner view only)
        registeredAt: reg?.createdAt || null,
        registrationEmail: reg?.email || "",
        fullName: reg?.fullName || "",
        phone: reg?.phone || "",
        dob: reg?.dob || "",
        emergencyContact: reg?.emergencyContact || "",
        notes: reg?.notes || "",
        bringingPartner: !!reg?.bringingPartner,
        partner: reg?.partner || null,
        // Payment tracking (admin/owner view only)
        feeAmount: fee.amount,
        feeSymbol: fee.symbol,
        amountPaid,
        remaining,
        paid,
        popUrl: reg?.popUrl || null,
        paidAt: reg?.paidAt || null,
        payments: (reg?.payments || []).map((p: any) => ({
          amount: p?.amount || 0,
          popUrl: p?.popUrl || null,
          note: p?.note || null,
          paidAt: p?.paidAt || null,
          recordedBy: p?.recordedBy || null,
        })),
      };
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
