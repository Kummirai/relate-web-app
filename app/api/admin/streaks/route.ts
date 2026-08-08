import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveUser } from "@/lib/community-auth";

// Matches the mobile app's streak calculations (prayer_app/src/utils/streaks.ts
// and prayer_app/src/services/reading-streak.ts).
const PRAYER_THRESHOLD = 3;
const MAX_STREAK_DAYS = 3650;

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function calcPrayerStreak(streaks: Record<string, Record<string, boolean>>): number {
  let streak = 0;
  const today = new Date();
  const todayKey = dateKey(today);
  const todayDay = streaks[todayKey];
  if (todayDay) {
    const completed = Object.values(todayDay).filter(Boolean).length;
    if (completed >= PRAYER_THRESHOLD) streak++;
  }
  for (let i = 1; i <= MAX_STREAK_DAYS; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const day = streaks[dateKey(d)];
    if (!day) break;
    const completed = Object.values(day).filter(Boolean).length;
    if (completed < PRAYER_THRESHOLD) break;
    streak++;
  }
  return streak;
}

function calcReadingStreak(days: string[]): number {
  const set = new Set(days);
  let streak = 0;
  const cursor = new Date();
  // If today isn't recorded yet, the streak can still be alive since yesterday.
  if (!set.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (set.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

async function requireAdmin(request: NextRequest) {
  const userId = await resolveUser(request);
  if (!userId || !ObjectId.isValid(userId)) return null;
  const db = await getDb();
  const user = await db.collection("user").findOne({ _id: new ObjectId(userId) });
  if (!user || user.role !== "admin") return null;
  return userId;
}

async function findUserDoc(db: any, id: string) {
  const byId = await db.collection("user").findOne({ id });
  if (byId) return byId;
  if (ObjectId.isValid(id)) {
    return db.collection("user").findOne({ _id: new ObjectId(id) });
  }
  return null;
}

function uidOf(doc: any): string {
  return doc?.id || doc?._id?.toString() || "";
}

export async function GET(request: NextRequest) {
  try {
    const adminId = await requireAdmin(request);
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const userId = searchParams.get("userId")?.trim() || "";

    // Detail view for a single user.
    if (userId) {
      const user = await findUserDoc(db, userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const uid = uidOf(user);
      const [prayerDoc, readingDoc] = await Promise.all([
        db.collection("user_streaks").findOne({ userId: uid }),
        db.collection("reading_streaks").findOne({ userId: uid }),
      ]);
      const prayerStreaks: Record<string, Record<string, boolean>> =
        prayerDoc?.streaks && typeof prayerDoc.streaks === "object" ? prayerDoc.streaks : {};
      const readingDays: string[] = Array.isArray(readingDoc?.days) ? readingDoc.days : [];
      return NextResponse.json({
        data: {
          user: {
            id: uid,
            name: user.name || "Unknown",
            email: user.email || "",
            image: user.image || null,
          },
          prayerStreak: calcPrayerStreak(prayerStreaks),
          prayerDayCount: Object.keys(prayerStreaks).length,
          prayerRecentDays: Object.keys(prayerStreaks).sort().reverse().slice(0, 14),
          readingStreak: calcReadingStreak(readingDays),
          readingDayCount: readingDays.length,
          readingRecentDays: [...readingDays].sort().reverse().slice(0, 14),
        },
      });
    }

    // Search view (name or email).
    if (search.length < 2) {
      return NextResponse.json({ data: [] });
    }
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    const users = await db
      .collection("user")
      .find({ $or: [{ name: regex }, { email: regex }] })
      .limit(10)
      .toArray();
    const ids = users.map(uidOf).filter(Boolean);
    const [prayerDocs, readingDocs] = await Promise.all([
      ids.length
        ? db.collection("user_streaks").find({ userId: { $in: ids } }).toArray()
        : Promise.resolve([]),
      ids.length
        ? db.collection("reading_streaks").find({ userId: { $in: ids } }).toArray()
        : Promise.resolve([]),
    ]);
    const prayerMap = new Map(prayerDocs.map((d) => [d.userId, d.streaks || {}]));
    const readingMap = new Map(readingDocs.map((d) => [d.userId, d.days || []]));
    const data = users.map((u) => {
      const uid = uidOf(u);
      return {
        id: uid,
        name: u.name || "Unknown",
        email: u.email || "",
        image: u.image || null,
        prayerStreak: calcPrayerStreak(prayerMap.get(uid) || {}),
        readingStreak: calcReadingStreak(readingMap.get(uid) || []),
      };
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch streaks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await requireAdmin(request);
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const db = await getDb();
    const user = await findUserDoc(db, userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const uid = uidOf(user);
    const now = new Date();
    const out: Record<string, unknown> = {};

    const parseTarget = (value: unknown) => {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 0 || n > MAX_STREAK_DAYS) return null;
      return n;
    };

    // Restore prayer streak: backfill the last N days (each fully completed),
    // merging with whatever days the user already has.
    if (body.prayerStreak !== undefined) {
      const target = parseTarget(body.prayerStreak);
      if (target === null) {
        return NextResponse.json(
          { error: "prayerStreak must be a whole number between 0 and 3650" },
          { status: 400 },
        );
      }
      let streaks: Record<string, Record<string, boolean>> = {};
      if (target > 0) {
        const existing = await db.collection("user_streaks").findOne({ userId: uid });
        streaks =
          existing?.streaks && typeof existing.streaks === "object"
            ? { ...existing.streaks }
            : {};
        for (let i = 0; i < target; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          streaks[dateKey(d)] = {
            dawn: true,
            sunrise: true,
            noon: true,
            afternoon: true,
            sunset: true,
            evening: true,
          };
        }
      }
      await db.collection("user_streaks").updateOne(
        { userId: uid },
        { $set: { streaks, updatedAt: new Date() } },
        { upsert: true },
      );
      out.prayerStreak = calcPrayerStreak(streaks);
      out.prayerDayCount = Object.keys(streaks).length;
    }

    // Restore reading streak: add the last N date keys.
    if (body.readingStreak !== undefined) {
      const target = parseTarget(body.readingStreak);
      if (target === null) {
        return NextResponse.json(
          { error: "readingStreak must be a whole number between 0 and 3650" },
          { status: 400 },
        );
      }
      let days: string[] = [];
      if (target > 0) {
        const existing = await db.collection("reading_streaks").findOne({ userId: uid });
        days = Array.isArray(existing?.days) ? [...existing.days] : [];
        const set = new Set(days);
        for (let i = 0; i < target; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          set.add(dateKey(d));
        }
        days = [...set];
      }
      await db.collection("reading_streaks").updateOne(
        { userId: uid },
        { $set: { days, updatedAt: new Date() } },
        { upsert: true },
      );
      out.readingStreak = calcReadingStreak(days);
      out.readingDayCount = days.length;
    }

    return NextResponse.json({ success: true, data: out });
  } catch {
    return NextResponse.json({ error: "Failed to restore streaks" }, { status: 500 });
  }
}
