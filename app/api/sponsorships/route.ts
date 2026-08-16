import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { getDb } from "@/lib/mongodb";
import { createSponsorship, ensureSponsorshipIndexes } from "@/lib/models";
import { requireAdmin } from "@/lib/community-auth";

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
    if (!existing) return candidate;
  }
  return generateSponsorId(Date.now() % 1000 + 1000);
}

function cleanContact(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 160) : "";
}

/**
 * Sponsorships — sponsorId: "REL" + year + 4 random uppercase chars.
 *
 *  - POST (public): record a sponsorship pledge with optional POP. No login
 *    required; the server always generates the sponsorId.
 *  - GET (admin only): list sponsorships, newest first.
 */
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    await ensureSponsorshipIndexes();

    const body = await request.json().catch(() => ({}));
    const name = cleanContact(body.name);
    const email = cleanContact(body.email);
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

    const sponsorId = await uniqueSponsorId(db);
    const doc = createSponsorship({
      sponsorId,
      name,
      email: email || null,
      phone: phone || null,
      amount,
      popUrl,
      status: popUrl ? "paid" : "pledged",
    });

    const result = await db.collection("sponsorships").insertOne(doc);
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
    const items = await db
      .collection("sponsorships")
      .find({})
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
