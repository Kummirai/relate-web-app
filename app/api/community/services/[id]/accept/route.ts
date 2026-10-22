import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { CLUB_SERVICES_COLLECTION, serializeService } from "@/lib/club-services";
import { createNotification } from "@/lib/inapp-notify";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";

/**
 * Claim an open service. Single-claim: only one member can hold a service
 * at a time, and the swap is atomic so two taps can't both win.
 * Notifies the admin who posted it.
 */
export async function POST(
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
      return NextResponse.json({ error: "Sign in to accept a service" }, { status: 401 });
    }

    const now = new Date();
    const updated = await db
      .collection(CLUB_SERVICES_COLLECTION)
      .findOneAndUpdate(
        { _id: new ObjectId(id), status: "open" },
        {
          $set: {
            status: "accepted",
            acceptedById: user.id,
            acceptedByName: user.name || "Member",
            acceptedAt: now,
            updatedAt: now,
          },
        },
        { returnDocument: "after" },
      );

    if (!updated) {
      return NextResponse.json(
        { error: "This service was already accepted." },
        { status: 409 },
      );
    }

    if (updated.posterId && updated.posterId !== user.id) {
      const titleText = "Service accepted";
      const bodyText = `${user.name || "A member"} accepted "${updated.title}".`;
      const data = { section: "services", itemId: id };
      await Promise.all([
        createNotification(db, updated.posterId, {
          type: "service_accepted",
          title: titleText,
          body: bodyText,
          data,
        }),
        sendPushNotifications(
          await getUserPushTokens(db, updated.posterId),
          titleText,
          bodyText,
          data,
        ),
      ]);
    }

    return NextResponse.json({ data: serializeService(updated) });
  } catch {
    return NextResponse.json({ error: "Failed to accept service" }, { status: 500 });
  }
}
