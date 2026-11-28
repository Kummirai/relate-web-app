import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";

const DEFAULTS = {
  enabled: true,
  advanceMinutes: 10,
  lat: -25.7,
  lng: 28.2,
  tzOffset: -120,
  readingEnabled: true,
  readingTime: "19:00",
  votdEnabled: true,
};

const FALLBACK = { disabled: [], custom: [], sounds: {}, ...DEFAULTS };

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isIntegerIn(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

function isNumberIn(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function isTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function booleanValue(value: unknown, fallback: boolean) {
  return isBoolean(value) ? value : fallback;
}

function integerValue(value: unknown, fallback: number, min: number, max: number) {
  return isIntegerIn(value, min, max) ? value : fallback;
}

function numberValue(value: unknown, fallback: number, min: number, max: number) {
  return isNumberIn(value, min, max) ? value : fallback;
}

function timeValue(value: unknown, fallback: string) {
  return isTime(value) ? value : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) return NextResponse.json(FALLBACK);
    const db = await getDb();
    const doc = await db.collection("user_prayer_preferences").findOne({ userId: user.id });
    return NextResponse.json({
      disabled: Array.isArray(doc?.disabled) ? doc.disabled : [],
      custom: Array.isArray(doc?.custom) ? doc.custom : [],
      sounds: doc?.sounds && typeof doc.sounds === "object" ? doc.sounds : {},
      enabled: booleanValue(doc?.enabled, DEFAULTS.enabled),
      advanceMinutes: integerValue(doc?.advanceMinutes, DEFAULTS.advanceMinutes, 0, 60),
      lat: numberValue(doc?.lat, DEFAULTS.lat, -90, 90),
      lng: numberValue(doc?.lng, DEFAULTS.lng, -180, 180),
      tzOffset: integerValue(doc?.tzOffset, DEFAULTS.tzOffset, -840, 840),
      readingEnabled: booleanValue(doc?.readingEnabled, DEFAULTS.readingEnabled),
      readingTime: timeValue(doc?.readingTime, DEFAULTS.readingTime),
      votdEnabled: booleanValue(doc?.votdEnabled, DEFAULTS.votdEnabled),
    });
  } catch {
    return NextResponse.json(FALLBACK);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    if (body.enabled !== undefined && !isBoolean(body.enabled)) {
      return NextResponse.json({ error: "Invalid enabled" }, { status: 400 });
    }
    if (body.advanceMinutes !== undefined && !isIntegerIn(body.advanceMinutes, 0, 60)) {
      return NextResponse.json({ error: "Invalid advanceMinutes" }, { status: 400 });
    }
    if (body.lat !== undefined && !isNumberIn(body.lat, -90, 90)) {
      return NextResponse.json({ error: "Invalid lat" }, { status: 400 });
    }
    if (body.lng !== undefined && !isNumberIn(body.lng, -180, 180)) {
      return NextResponse.json({ error: "Invalid lng" }, { status: 400 });
    }
    if (body.tzOffset !== undefined && !isIntegerIn(body.tzOffset, -840, 840)) {
      return NextResponse.json({ error: "Invalid tzOffset" }, { status: 400 });
    }
    if (body.readingEnabled !== undefined && !isBoolean(body.readingEnabled)) {
      return NextResponse.json({ error: "Invalid readingEnabled" }, { status: 400 });
    }
    if (body.readingTime !== undefined && !isTime(body.readingTime)) {
      return NextResponse.json({ error: "Invalid readingTime" }, { status: 400 });
    }
    if (body.votdEnabled !== undefined && !isBoolean(body.votdEnabled)) {
      return NextResponse.json({ error: "Invalid votdEnabled" }, { status: 400 });
    }

    const db = await getDb();
    const update: Record<string, any> = { updatedAt: new Date() };
    if (body.disabled !== undefined) update.disabled = body.disabled;
    if (body.custom !== undefined) update.custom = body.custom;
    if (body.sounds !== undefined) update.sounds = body.sounds;
    if (body.enabled !== undefined) update.enabled = body.enabled;
    if (body.advanceMinutes !== undefined) update.advanceMinutes = body.advanceMinutes;
    if (body.lat !== undefined) update.lat = body.lat;
    if (body.lng !== undefined) update.lng = body.lng;
    if (body.tzOffset !== undefined) update.tzOffset = body.tzOffset;
    if (body.readingEnabled !== undefined) update.readingEnabled = body.readingEnabled;
    if (body.readingTime !== undefined) update.readingTime = body.readingTime;
    if (body.votdEnabled !== undefined) update.votdEnabled = body.votdEnabled;
    await db.collection("user_prayer_preferences").updateOne(
      { userId: user.id },
      { $set: update },
      { upsert: true },
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
