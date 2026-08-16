import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { getDb } from "@/lib/mongodb";
import { createSponsorship, ensureSponsorshipIndexes } from "@/lib/models";
import { requireAdmin, resolveSession } from "@/lib/community-auth";
import { getAdminPushTokens, sendPushNotifications } from "@/lib/push";
import { notifyAdmins } from "@/lib/inapp-notify";

const SPONSOR_ID_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomChars(count: number): string {
  let out = "";
  for (let i = 0; i < count; i++) {
    out += SPONSOR_ID_ALPHABET[randomInt(SPONSOR_ID_ALPHABET.length)];
  }
  return out;
}

/** "REL" + last two digits of the year + 4 random chars, all caps. */
export function generateSponsorId(year = new Date().getFullYear()): string {
  const yy = String(year).slice(-2);
  return `REL${yy}${randomChars(4)}`;
}

async function uniqueSponsorId(db: any): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = generateSponsorId();
    const existing = await db
      .collection("sponsorships")
      .findOne({ sponsorId: candidate }, { projection: { _id: 1 } });
    const onUser = await db
      .collection("user")
      .findOne({ sponsorId: candidate }, { projection: { _id: 1 } });
    if (!existing && !onUser) return candidate;
  }
  return generateSponsorId(Date.now() % 1000 + 1000);
}

/**
 * A user's stable sponsor ID — created on their first pledge, reused for every
 * transaction after that. Stored on the user doc (indexed, unique).
 */
async function resolveSponsorIdForUser(db: any, userId: string): Promise<string> {
  const user = await db
    .collection("user")
    .findOne({ id: userId }, { projection: { sponsorId: 1 } });
  if (user?.sponsorId) return user.sponsorId;
  const sponsorId = await uniqueSponsorId(db);
  await db
    .collection("user")
    .updateOne({ id: userId }, { $set: { sponsorId } }, { upsert: false });
  return sponsorId;
}

function cleanContact(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 160) : "";
}

/**
 * Sponsorships — sponsorId: "REL" + year + 4 random uppercase chars.
 *
 *  - POST (login required): record a sponsorship pledge with optional POP.
 *    Requires an authenticated user; the server assigns their stable sponsor
 *    ID (created on the first pledge) and notifies all admins.
 *  - GET (admin only): list sponsorships, newest first.
 */
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    await ensureSponsorshipIndexes();

    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to sponsor Relate" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = cleanContact(body.name) || user.name || "";
    const email = cleanContact(body.email) || "";
    const phone = cleanContact(body.phone);
    const amount = Math.round(parseFloat(String(body.amount ?? "")) * 100) / 100;
    const popUrl =
      typeof body.popUrl === "string" && body.popUrl.trim()
        ? body.popUrl.trim().slice(0, 500)
        : null;

    if (!name) {
      return NextResponse.json({ error: "Your name is required" }, { status: 400 });
    }
    if (!email && !phone) {
      return NextResponse.json(
        { error: "An email or phone number is required" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "A sponsorship amount greater than zero is required" },
        { status: 400 },
      );
    }

    const sponsorId = await resolveSponsorIdForUser(db, user.id);
    const doc = createSponsorship({
      sponsorId,
      name,
      email: email || null,
      phone: phone || null,
      amount,
      popUrl,
      userId: user.id,
      status: "pending",
    });

    const result = await db.collection("sponsorships").insertOne(doc);

    // Awaited so Vercel doesn't freeze the function before Expo delivery.
    try {
      await sendPushNotifications(
        await getAdminPushTokens(db),
        "New sponsor pledge",
        `${name} · R ${amount.toLocaleString("en-US")}`,
        { type: "new_sponsorship", sponsorId },
      );
      await notifyAdmins(
        db,
        {
          type: "new_sponsorship",
          title: "New sponsor pledge",
          body: `${name} · R ${amount.toLocaleString("en-US")} (${sponsorId})`,
          data: { sponsorId },
        },
        user.id,
      );
    } catch {}

    return NextResponse.json({
      data: { _id: result.insertedId.toString(), ...doc },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to record sponsorship" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    await ensureSponsorshipIndexes();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const query = status === "approved" || status === "pending" || status === "rejected"
      ? { status }
      : {};
    const items = await db
      .collection("sponsorships")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({ data: items });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch sponsorships" },
      { status: 500 },
    );
  }
}
