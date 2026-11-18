import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sendPushMessages, type PushMessage } from "@/lib/push";

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

/**
 * Daily streak reminder (Vercel cron, 13:00 Africa/Lusaka — after the noon
 * prayer). Users who already reached the 3-prayer threshold today are skipped;
 * everyone else gets either a "your streak is at risk" push or a "start a new
 * streak" push. Requires CRON_SECRET when set (Vercel sends it automatically).
 */
export async function GET(request: NextRequest) {
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

    const [streakDocs, tokenDocs] = await Promise.all([
      db.collection("user_streaks").find({}).toArray(),
      db.collection("push_tokens").find({}).toArray(),
    ]);

    const tokensByUser = new Map<string, string[]>();
    for (const doc of tokenDocs) {
      const userId = doc?.userId ? String(doc.userId) : "";
      const token = typeof doc?.token === "string" ? doc.token : "";
      if (!userId || !token) continue;
      const list = tokensByUser.get(userId) || [];
      if (!list.includes(token)) list.push(token);
      tokensByUser.set(userId, list);
    }

    const messages: PushMessage[] = [];
    for (const doc of streakDocs) {
      const userId = doc?.userId ? String(doc.userId) : "";
      const tokens = tokensByUser.get(userId);
      if (!tokens?.length) continue;

      const streaks =
        doc?.streaks && typeof doc.streaks === "object" ? doc.streaks : {};
      const done = completedIn(streaks[today]);
      if (done >= STREAK_THRESHOLD) continue;

      let streak = 0;
      let key = previousDayKey(today);
      for (let i = 0; i < 3660; i++) {
        if (completedIn(streaks[key]) < STREAK_THRESHOLD) break;
        streak++;
        key = previousDayKey(key);
      }

      const remaining = STREAK_THRESHOLD - done;
      const title = streak > 0 ? "Keep your streak alive" : "Time to pray";
      const body =
        streak > 0
          ? `You are on a ${streak}-day prayer streak. You have prayed ${done} of ${STREAK_THRESHOLD} today — pray ${remaining} more to keep it.`
          : done > 0
            ? `You have prayed ${done} of ${STREAK_THRESHOLD} today. ${remaining} more ${remaining === 1 ? "starts" : "start"} a new streak.`
            : "You have not prayed yet today. One prayer is all it takes to start a new streak.";

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
