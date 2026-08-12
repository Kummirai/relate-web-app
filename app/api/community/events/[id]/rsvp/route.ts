import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { resolveUser, resolveSession } from "@/lib/community-auth";
import { createNotification } from "@/lib/inapp-notify";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const user = await resolveSession(request);
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await db.collection("community_events").findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Optional registration details submitted alongside the RSVP (event
    // booking form). Older clients simply toggle without a body.
    let registration: any = null;
    try {
      const body = await request.json();
      if (body && typeof body === "object") {
        const hasDetails = ["fullName", "email", "phone", "emergencyContact"].some(
          (k) => typeof body[k] === "string" && body[k].trim() !== "",
        );
        if (hasDetails) {
          registration = {
            fullName: String(body.fullName || "").trim(),
            email: String(body.email || "").trim(),
            phone: String(body.phone || "").trim(),
            dob: String(body.dob || "").trim(),
            emergencyContact: String(body.emergencyContact || "").trim(),
            notes: String(body.notes || "").trim(),
            bringingPartner: !!body.bringingPartner,
            partner: body.partner
              ? {
                  fullName: String(body.partner.fullName || "").trim(),
                  phone: String(body.partner.phone || "").trim(),
                  dob: String(body.partner.dob || "").trim(),
                  email: String(body.partner.email || "").trim(),
                }
              : null,
          };
        }
      }
    } catch {
      // No JSON body — plain RSVP toggle.
    }

    const alreadyRsvpd = (event.rsvpUserIds || []).includes(userId);

    if (alreadyRsvpd && registration) {
      // Re-registration with details (e.g. a retry after a lost response):
      // keep the seat and refresh the stored details instead of toggling off.
      await db.collection("event_registrations").updateOne(
        { eventId: new ObjectId(id), userId },
        { $set: { ...registration, updatedAt: new Date() } },
        { upsert: true },
      );
      await db.collection("community_events").updateOne(
        { _id: new ObjectId(id) },
        { $addToSet: { rsvpUserIds: userId } },
      );
    } else if (alreadyRsvpd) {
      // Cancel: remove this user's registration(s) and free their seats.
      const regs = await db
        .collection("event_registrations")
        .find({ eventId: new ObjectId(id), userId })
        .toArray();
      const decrement = regs.length
        ? regs.some((r: any) => r.bringingPartner)
          ? 2
          : 1
        : 1;

      await db.collection("event_registrations").deleteMany({
        eventId: new ObjectId(id),
        userId,
      });
      await db.collection("community_events").updateOne(
        { _id: new ObjectId(id) },
        {
          $pull: { rsvpUserIds: userId },
          $set: { attending: Math.max(0, (event.attending || 0) - decrement) },
        },
      );
    } else {
      const increment = registration?.bringingPartner ? 2 : 1;
      // $inc keeps concurrent RSVPs atomic.
      await db.collection("community_events").updateOne(
        { _id: new ObjectId(id) },
        {
          $addToSet: { rsvpUserIds: userId },
          $inc: { attending: increment },
        },
      );

      if (registration) {
        await db.collection("event_registrations").insertOne({
          eventId: new ObjectId(id),
          userId,
          ...registration,
          createdAt: new Date(),
        });
      }

      if (event.userId && event.userId !== userId) {
        await db.collection("user_activity").insertOne({
          userId: event.userId,
          actorId: userId,
          type: "rsvp",
          section: "events",
          itemId: id,
          itemTitle: event.title || "Event",
          createdAt: new Date(),
        });

        // Let the event owner know someone is coming (in-app + device banner).
        // Awaited so Vercel doesn't freeze the function before delivery.
        try {
          const actorName = user?.name || "Someone";
          const title = "New RSVP";
          const body = `${actorName} is coming to ${event.title || "your event"}`;
          const data = { tab: "social", itemId: id };
          await Promise.all([
            createNotification(db, event.userId, {
              type: "event_rsvp",
              title,
              body,
              data,
            }),
            sendPushNotifications(
              await getUserPushTokens(db, event.userId),
              title,
              body,
              data,
            ),
          ]);
        } catch {}
      }
    }

    const willBeRsvpd = alreadyRsvpd ? !!registration : true;
    const updated = await db.collection("community_events").findOne({ _id: new ObjectId(id) });
    return NextResponse.json({
      data: {
        ...updated,
        hasRsvpd: willBeRsvpd,
        attending: updated?.attending || 0,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to RSVP" }, { status: 500 });
  }
}
