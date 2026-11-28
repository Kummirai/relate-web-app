import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  getPushTokensByUserIds,
  sendPushMessages,
  type PushMessage,
} from "@/lib/push";
import { withCpuTiming } from "@/lib/api-timing";

const PRAYERS = [
  "dawn",
  "sunrise",
  "noon",
  "afternoon",
  "sunset",
  "evening",
] as const;
const STREAK_THRESHOLD = 3;
const TIME_ZONE = "Africa/Lusaka";

function dayKey(date: Date) {
  // en-CA formats as YYYY-MM-DD, matching the keys the app writes.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

function previousDayKey(key: string) {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function completedIn(day: unknown) {
  if (!day || typeof day !== "object") return 0;
  const record = day as Record<string, unknown>;
  return PRAYERS.filter((prayer) => record[prayer] === true).length;
}

function streakThroughYesterday(streaks: Record<string, unknown>, today: string) {
  let streak = 0;
  let key = previousDayKey(today);
  for (let i = 0; i < 3660; i++) {
    if (completedIn(streaks[key]) < STREAK_THRESHOLD) break;
    streak++;
    key = previousDayKey(key);
  }
  return streak;
}

function buildReminder(done: number, pastStreak: number) {
  const remaining = STREAK_THRESHOLD - done;
  if (done >= STREAK_THRESHOLD) {
    return {
      title: "Streak secured",
      body: `${done} prayers today, ${pastStreak + 1} days strong. "Pray continually." — 1 Thess. 5:17`,
    };
  }
  if (pastStreak > 0) {
    return {
      title: "Keep your streak alive",
      body: `${remaining} more ${remaining === 1 ? "prayer" : "prayers"} keeps your ${pastStreak}-day streak alive. "Devote yourselves to prayer." — Col. 4:2`,
    };
  }
  if (done > 0) {
    return {
      title: "Time to pray",
      body: `${remaining} more ${remaining === 1 ? "prayer starts" : "prayers start"} a new streak. "The prayer of a righteous person is powerful." — James 5:16`,
    };
  }
  return {
    title: "Time to pray",
    body: 'One prayer starts a streak. "Draw near to God, and He will draw near to you." — James 4:8',
  };
}

/**
 * Daily prayer streak reminder (Vercel cron, 13:00 Africa/Lusaka — after the
 * noon prayer). Every message depends on the user's live prayer record for
 * that day: users behind on prayers are nudged (streak at risk, or start a
 * streak), and users who already reached the threshold get a "streak secured"
 * note. Requires CRON_SECRET when set (Vercel sends it automatically).
 */
async function handleGet(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const hasSecret = Boolean(secret) && auth === `Bearer ${secret}`;
  const authorized = secret ? hasSecret : isVercelCron;
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const today = dayKey(new Date());
    const force = hasSecret && request.nextUrl.searchParams.get("force") === "1";

    // One run per day. Doubles as idempotency for retries and prevents a
    // repeated trigger from pushing twice.
    if (!force) {
      const claim = await db
        .collection("cron_runs")
        .updateOne(
          { _id: `streak-reminders:${today}` },
          { $setOnInsert: { createdAt: new Date() } },
          { upsert: true },
        );
      if (!claim.upsertedCount) {
        return NextResponse.json({ skipped: "already ran today", day: today });
      }
    }

    const streakDocs = await db
      .collection("user_streaks")
      .find({}, { projection: { userId: 1, streaks: 1 } })
      .toArray();
    const streakUserIds = [
      ...new Set(streakDocs.map((doc) => String(doc?.userId || "")).filter(Boolean)),
    ] as string[];
    const tokensByUser = streakUserIds.length
      ? await getPushTokensByUserIds(db, streakUserIds)
      : new Map<string, string[]>();

    const messages: PushMessage[] = [];
    for (const doc of streakDocs) {
      const userId = doc?.userId ? String(doc.userId) : "";
      const tokens = tokensByUser.get(userId);
      if (!tokens?.length) continue;

      const streaks =
        doc?.streaks && typeof doc.streaks === "object" ? doc.streaks : {};
      const done = completedIn(streaks[today]);
      const pastStreak = streakThroughYesterday(streaks, today);
      const { title, body } = buildReminder(done, pastStreak);
      const remaining = Math.max(0, STREAK_THRESHOLD - done);

      for (const to of tokens) {
        messages.push({
          to,
          title,
          body,
          data: { streakReminder: true, done, remaining },
        });
      }
    }

    await sendPushMessages(messages);
    return NextResponse.json({
      day: today,
      users: streakDocs.length,
      sent: messages.length,
    });
  } catch (error) {
    console.error("[cron] streak reminders failed", error);
    return NextResponse.json(
      { error: "Failed to send streak reminders" },
      { status: 500 },
    );
  }
}

export const GET = withCpuTiming("cron/streak-reminders.GET", handleGet);
