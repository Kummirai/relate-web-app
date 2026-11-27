import { getDb } from "./mongodb";
import {
  WEB_PUSH_COLLECTION,
  toWebPushSubscription,
  sendWebPushToSubscriptions,
  type WebPushSubscription,
} from "./push";

type SunMinutes = { sunrise: number; noon: number; sunset: number };

type ScheduledEvent = {
  type: string;
  eventKey: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  dueAt: number;
  votd?: boolean;
};

export type ScheduledReminderResult = {
  day: string;
  users: number;
  due: number;
  sent: number;
  skipped: number;
};

export type ScheduledReminderRunOptions = {
  userIds?: string[];
  lookbackMs?: number;
};

type DueScheduledEvent = ScheduledEvent & { dayKey: string };

const PRAYER_KEYS = ["dawn", "sunrise", "noon", "afternoon", "sunset", "evening"] as const;
const PRAYER_LABELS: Record<string, string> = {
  dawn: "Dawn",
  sunrise: "Sunrise",
  noon: "Noon",
  afternoon: "Afternoon",
  sunset: "Sunset",
  evening: "Evening",
};
const PRAYER_PROMPTS: Record<string, string> = {
  dawn: "It is prayer time. A new day to seek His face",
  sunrise: "It is prayer time. His mercies are new this morning",
  noon: "It is prayer time. Pause and be still with Him",
  afternoon: "It is prayer time. He walks with you through this day",
  sunset: "It is prayer time. Give thanks for the day He gave",
  evening: "It is prayer time. Rest in His peace tonight",
};
const ADVANCE_PROMPTS: Record<string, string> = {
  dawn: "The world is quiet — meet with Him before the day begins.",
  sunrise: "Light is breaking — greet the One who made the sun.",
  noon: "The day is busy — pause now and be still with God.",
  afternoon: "Take a breath and carry His presence into the afternoon.",
  sunset: "The day is closing — give thanks for what it held.",
  evening: "The night is near — rest in His peace.",
};
const FALLBACK_SUN: SunMinutes = { sunrise: 6 * 60 + 15, noon: 12 * 60, sunset: 18 * 60 + 30 };
const DUE_WINDOW_MS = 70 * 60_000;
const MAX_REMINDER_LOOKBACK_MS = 24 * 60 * 60_000;
const REMINDER_DAY_START_HOUR = 3;
const REMINDER_DAY_END_HOUR = 21;
const VOTD_VERSION_ID = 3034;
const GENERIC_VERSE = "“Your word is a lamp to my feet and a light to my path.” — Psalm 119:105";

const votdCache = new Map<string, string>();

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function numberIn(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
    ? value
    : fallback;
}

function integerIn(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function parseTime(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function localWallNow(now: Date, tzOffset: number): Date {
  return new Date(now.getTime() - tzOffset * 60_000);
}

function localDayKey(local: Date): string {
  return local.toISOString().slice(0, 10);
}

function localDateTime(dayKey: string, minutes: number): number {
  return Date.parse(`${dayKey}T00:00:00.000Z`) + minutes * 60_000;
}

async function fetchJson(url: string, headers: Record<string, string>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as Record<string, any>;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSunMinutes(
  lat: number,
  lng: number,
  dayKey: string,
  tzOffset: number,
  cache: Map<string, SunMinutes>,
): Promise<SunMinutes> {
  const key = `${lat.toFixed(3)}:${lng.toFixed(3)}:${dayKey}:${tzOffset}`;
  const cached = cache.get(key);
  if (cached) return cached;

  let result = FALLBACK_SUN;
  const url = `https://api.sunrise-sunset.org/json?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}&formatted=0&date=${dayKey}`;
  const data = await fetchJson(url, {});
  const toMinutes = (value: unknown): number | null => {
    const parsed = Date.parse(text(value));
    if (!Number.isFinite(parsed)) return null;
    const localMs = new Date(parsed - tzOffset * 60_000);
    return localMs.getUTCHours() * 60 + localMs.getUTCMinutes();
  };
  if (data?.status === "OK" && data?.results) {
    const sunrise = toMinutes(data.results.sunrise);
    const noon = toMinutes(data.results.solar_noon);
    const sunset = toMinutes(data.results.sunset);
    if (sunrise !== null && noon !== null && sunset !== null) {
      result = { sunrise, noon, sunset };
    }
  }
  cache.set(key, result);
  return result;
}

async function getVotdBody(dayKey: string): Promise<string> {
  const cached = votdCache.get(dayKey);
  if (cached) return cached;

  let body = GENERIC_VERSE;
  const appKey = text(process.env.EXPO_PUBLIC_YVP_APP_KEY);
  if (appKey) {
    try {
      const [year, month, day] = dayKey.split("-").map(Number);
      const dayOfYear = Math.floor(
        (Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86_400_000,
      );
      const headers = {
        "X-YVP-App-Key": appKey,
        "X-YVP-Installation-Id": "relate-world-backend",
      };
      const votd = await fetchJson(
        `https://api.youversion.com/v1/verse_of_the_days/${dayOfYear}`,
        headers,
      );
      const passageId = text(votd?.passage_id);
      if (passageId) {
        const passage = await fetchJson(
          `https://api.youversion.com/v1/bibles/${VOTD_VERSION_ID}/passages/${encodeURIComponent(passageId)}?format=text`,
          headers,
        );
        const raw = text(passage?.content);
        if (raw) {
          const cleaned = raw
            .replace(/<[^>]*>/g, " ")
            .replace(/\[[^\]]*\]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          const reference = text(passage?.reference);
          body = `“${cleaned}”${reference ? ` — ${reference}` : ""}`;
        }
      }
    } catch {
      body = GENERIC_VERSE;
    }
  }
  votdCache.set(dayKey, body);
  return body;
}

function buildEvents(
  prefs: Record<string, any>,
  sun: SunMinutes,
  dayKey: string,
  advanceMinutes: number,
): ScheduledEvent[] {
  const events: ScheduledEvent[] = [];
  const addPrayer = (
    prefix: string,
    key: string,
    label: string,
    minutes: number,
    data: Record<string, unknown>,
  ) => {
    const dueAt = localDateTime(dayKey, minutes);
    events.push({
      type: prefix,
      eventKey: key,
      title: `Prayer time · ${label}`,
      body: PRAYER_PROMPTS[key] || "It is prayer time. Pause and seek Him.",
      data: { route: "/", prayer: key, prayerKey: key, ...data },
      dueAt,
    });
    if (advanceMinutes > 0) {
      events.push({
        type: `${prefix}-advance`,
        eventKey: key,
        title: `Prayer in ${advanceMinutes} min · ${label}`,
        body: ADVANCE_PROMPTS[key] || "Your prayer time is coming up.",
        data: {
          route: "/",
          prayer: key,
          prayerKey: key,
          advance: true,
          advanceMinutes,
          ...data,
        },
        dueAt: dueAt - advanceMinutes * 60_000,
      });
    }
  };

  const disabled = new Set(
    (Array.isArray(prefs.disabled) ? prefs.disabled : []).map((key: unknown) => text(key)),
  );
  const times: Record<string, number> = {
    dawn: sun.sunrise - 90,
    sunrise: sun.sunrise,
    noon: sun.noon,
    afternoon: Math.floor((sun.noon + sun.sunset) / 2),
    sunset: sun.sunset,
    evening: sun.sunset + 90,
  };
  for (const key of PRAYER_KEYS) {
    if (disabled.has(key)) continue;
    addPrayer("prayer", key, PRAYER_LABELS[key], times[key], {});
  }

  if (booleanValue(prefs.votdEnabled, true)) {
    events.push({
      type: "votd",
      eventKey: "votd",
      title: "Verse of the Day",
      body: GENERIC_VERSE,
      data: { route: "/", votdReminder: true },
      dueAt: localDateTime(dayKey, 7 * 60),
      votd: true,
    });
  }

  if (booleanValue(prefs.readingEnabled, true)) {
    const readingMinute = parseTime(prefs.readingTime) ?? 19 * 60;
    events.push({
      type: "reading",
      eventKey: "reading",
      title: "Time to read today's magazine",
      body: "Your club reading is waiting — open today's study when you're ready.",
      data: { route: "/library", readingReminder: true },
      dueAt: localDateTime(dayKey, readingMinute),
    });
  }

  return events;
}

async function claimEvent(
  db: any,
  userId: string,
  dayKey: string,
  event: ScheduledEvent,
): Promise<boolean> {
  const key = `${userId}:${dayKey}:${event.type}:${event.eventKey}`;
  try {
    const result = await db.collection("scheduled_push_sent").updateOne(
      { _id: key },
      {
        $setOnInsert: {
          userId,
          key,
          day: dayKey,
          type: event.type,
          eventKey: event.eventKey,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    return Boolean(result.upsertedCount);
  } catch (error: any) {
    if (error?.code === 11000) return false;
    throw error;
  }
}

export async function runScheduledReminders(
  now: Date = new Date(),
  options: ScheduledReminderRunOptions = {},
): Promise<ScheduledReminderResult> {
  const db = await getDb();
  const userIdsFilter = options.userIds?.length ? { userId: { $in: options.userIds } } : {};
  const prefsDocs = await db
    .collection("user_prayer_preferences")
    .find({ enabled: { $ne: false }, ...userIdsFilter })
    .toArray();
  const userIds = [...new Set(prefsDocs.map((doc: any) => text(doc?.userId)).filter(Boolean))];
  const subscriptionsByUser = new Map<string, WebPushSubscription[]>();
  if (userIds.length) {
    const subDocs = await db
      .collection(WEB_PUSH_COLLECTION)
      .find({ userId: { $in: userIds } })
      .toArray();
    for (const doc of subDocs) {
      const subscription = toWebPushSubscription(doc);
      if (!subscription?.userId) continue;
      const list = subscriptionsByUser.get(subscription.userId) || [];
      list.push(subscription);
      subscriptionsByUser.set(subscription.userId, list);
    }
  }

  const lookbackMs = Math.min(
    MAX_REMINDER_LOOKBACK_MS,
    Math.max(DUE_WINDOW_MS, options.lookbackMs ?? DUE_WINDOW_MS),
  );
  const sunCache = new Map<string, SunMinutes>();
  let due = 0;
  let sent = 0;
  let skipped = 0;
  let users = 0;
  let resultDayKey = localDayKey(localWallNow(now, -120));

  for (const doc of prefsDocs) {
    const userId = text((doc as any)?.userId);
    const subscriptions = subscriptionsByUser.get(userId) || [];
    if (!userId || !subscriptions.length) continue;

    const prefs = doc as Record<string, any>;
    const tzOffset = integerIn(prefs.tzOffset, -120, -840, 840);
    const lat = numberIn(prefs.lat, -25.7, -90, 90);
    const lng = numberIn(prefs.lng, 28.2, -180, 180);
    const advanceMinutes = integerIn(prefs.advanceMinutes, 10, 0, 60);
    const localNow = localWallNow(now, tzOffset);
    const localHour = localNow.getUTCHours();
    if (localHour < REMINDER_DAY_START_HOUR || localHour > REMINDER_DAY_END_HOUR) continue;
    users++;
    resultDayKey = localDayKey(localNow);
    const dayKeys = [resultDayKey];
    if (lookbackMs > DUE_WINDOW_MS) {
      const previousDayKey = localDayKey(
        new Date(localNow.getTime() - MAX_REMINDER_LOOKBACK_MS),
      );
      if (previousDayKey !== resultDayKey) dayKeys.push(previousDayKey);
    }

    const dueEvents: DueScheduledEvent[] = [];
    for (const eventDayKey of dayKeys) {
      const sun = await fetchSunMinutes(lat, lng, eventDayKey, tzOffset, sunCache);
      const events = buildEvents(prefs, sun, eventDayKey, advanceMinutes);
      for (const event of events) {
        dueEvents.push({ ...event, dayKey: eventDayKey });
      }
    }

    const nowMs = localNow.getTime();
    const windowedEvents = dueEvents.filter((event) => {
      if (event.dueAt > nowMs || event.dueAt < nowMs - lookbackMs) return false;
      const dueHour = new Date(event.dueAt).getUTCHours();
      return dueHour >= REMINDER_DAY_START_HOUR && dueHour < REMINDER_DAY_END_HOUR;
    });

    for (const event of windowedEvents) {
      due++;
      const claimed = await claimEvent(db, userId, event.dayKey, event);
      if (!claimed) {
        skipped++;
        continue;
      }
      const body = event.votd ? await getVotdBody(event.dayKey) : event.body;
      sent += await sendWebPushToSubscriptions(
        subscriptions,
        event.title,
        body,
        { ...event.data, scheduled: true },
      );
    }
  }

  return { day: resultDayKey, users, due, sent, skipped };
}
