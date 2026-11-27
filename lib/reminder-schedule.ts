import { getDb } from "./mongodb";
import {
  WEB_PUSH_COLLECTION,
  toWebPushSubscription,
  sendWebPushToSubscriptions,
  type WebPushSubscription,
} from "./push";
import { publishDelayedMessages, reminderDedupeId, type DelayedPublish } from "./qstash";

type SunMinutes = { sunrise: number; noon: number; sunset: number };

type ReminderEvent = {
  type: string;
  eventKey: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  dueAt: number;
  votd?: boolean;
};

export type ReminderPrefs = {
  enabled: boolean;
  advanceMinutes: number;
  lat: number;
  lng: number;
  tzOffset: number;
  readingEnabled: boolean;
  readingTime: string;
  votdEnabled: boolean;
  disabled: Set<string>;
  updatedAt: string | null;
};

const DEFAULT_REMINDER_PREFS = {
  enabled: true,
  advanceMinutes: 10,
  lat: -25.7,
  lng: 28.2,
  tzOffset: -120,
  readingEnabled: true,
  readingTime: "19:00",
  votdEnabled: true,
};

export type ReminderPayload = {
  userId: string;
  endpoint: string;
  dayKey: string;
  type: string;
  eventKey: string;
  minute: number;
  settingsAt: string | null;
};

export type DeliverResult = {
  status: "sent" | "skipped" | "removed";
  reason?: string;
};

export type PlanResult = {
  users: number;
  subscriptions: number;
  messages: number;
  published: number;
};

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
const REMINDER_DAY_START_HOUR = 3;
const REMINDER_DAY_END_HOUR = 21;
const VOTD_VERSION_ID = 3034;
const VOTD_MINUTE = 7 * 60;
const GENERIC_VERSE = "“Your word is a lamp to my feet and a light to my path.” — Psalm 119:105";
const PLAN_WINDOW_MS = 24 * 60 * 60_000;

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

function dayHourIsAwake(dueAt: number): boolean {
  const hour = new Date(dueAt).getUTCHours();
  return hour >= REMINDER_DAY_START_HOUR && hour < REMINDER_DAY_END_HOUR;
}

export function normalizePrefs(doc: Record<string, any> | null | undefined): ReminderPrefs {
  const disabled = Array.isArray(doc?.disabled)
    ? new Set(doc.disabled.map((key: unknown) => text(key)).filter(Boolean))
    : new Set<string>();
  const updatedAt =
    doc?.updatedAt instanceof Date && Number.isFinite(doc.updatedAt.getTime())
      ? doc.updatedAt.toISOString()
      : null;
  return {
    enabled: booleanValue(doc?.enabled, DEFAULT_REMINDER_PREFS.enabled),
    advanceMinutes: integerIn(
      doc?.advanceMinutes,
      DEFAULT_REMINDER_PREFS.advanceMinutes,
      0,
      60,
    ),
    lat: numberIn(doc?.lat, DEFAULT_REMINDER_PREFS.lat, -90, 90),
    lng: numberIn(doc?.lng, DEFAULT_REMINDER_PREFS.lng, -180, 180),
    tzOffset: integerIn(doc?.tzOffset, DEFAULT_REMINDER_PREFS.tzOffset, -840, 840),
    readingEnabled: booleanValue(doc?.readingEnabled, DEFAULT_REMINDER_PREFS.readingEnabled),
    readingTime:
      parseTime(doc?.readingTime) !== null
        ? text(doc?.readingTime)
        : DEFAULT_REMINDER_PREFS.readingTime,
    votdEnabled: booleanValue(doc?.votdEnabled, DEFAULT_REMINDER_PREFS.votdEnabled),
    disabled,
    updatedAt,
  };
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

function prayerMinutes(sun: SunMinutes): Record<string, number> {
  return {
    dawn: sun.sunrise - 90,
    sunrise: sun.sunrise,
    noon: sun.noon,
    afternoon: Math.floor((sun.noon + sun.sunset) / 2),
    sunset: sun.sunset,
    evening: sun.sunset + 90,
  };
}

function buildEvents(
  prefs: ReminderPrefs,
  sun: SunMinutes,
  dayKey: string,
  includeAll = false,
): ReminderEvent[] {
  const events: ReminderEvent[] = [];
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
    if (prefs.advanceMinutes > 0) {
      events.push({
        type: `${prefix}-advance`,
        eventKey: key,
        title: `Prayer in ${prefs.advanceMinutes} min · ${label}`,
        body: ADVANCE_PROMPTS[key] || "Your prayer time is coming up.",
        data: {
          route: "/",
          prayer: key,
          prayerKey: key,
          advance: true,
          advanceMinutes: prefs.advanceMinutes,
          ...data,
        },
        dueAt: dueAt - prefs.advanceMinutes * 60_000,
      });
    }
  };

  const times = prayerMinutes(sun);
  for (const key of PRAYER_KEYS) {
    if (!includeAll && prefs.disabled.has(key)) continue;
    addPrayer("prayer", key, PRAYER_LABELS[key], times[key], {});
  }

  if (includeAll || prefs.votdEnabled) {
    events.push({
      type: "votd",
      eventKey: "votd",
      title: "Verse of the Day",
      body: GENERIC_VERSE,
      data: { route: "/", votdReminder: true },
      dueAt: localDateTime(dayKey, VOTD_MINUTE),
      votd: true,
    });
  }

  if (includeAll || prefs.readingEnabled) {
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

function minuteOfDay(dueAt: number, dayKey: string): number {
  return Math.round((dueAt - Date.parse(`${dayKey}T00:00:00.000Z`)) / 60_000);
}

async function buildUserMessages(
  userId: string,
  endpoints: string[],
  prefs: ReminderPrefs,
  now: Date,
  deliverUrl: string,
  sunCache: Map<string, SunMinutes>,
): Promise<DelayedPublish[]> {
  const localNow = localWallNow(now, prefs.tzOffset);
  const todayKey = localDayKey(localNow);
  const tomorrowKey = localDayKey(new Date(localNow.getTime() + 86_400_000));
  const nowMs = localNow.getTime();
  const messages: DelayedPublish[] = [];

  for (const dayKey of [todayKey, tomorrowKey]) {
    const sun = await fetchSunMinutes(prefs.lat, prefs.lng, dayKey, prefs.tzOffset, sunCache);
    for (const event of buildEvents(prefs, sun, dayKey, true)) {
      if (event.dueAt <= nowMs || event.dueAt > nowMs + PLAN_WINDOW_MS) continue;
      if (!dayHourIsAwake(event.dueAt)) continue;
      const minute = minuteOfDay(event.dueAt, dayKey);
      const notBefore = Math.floor((event.dueAt + prefs.tzOffset * 60_000) / 1000);
      const payload: ReminderPayload = {
        userId,
        endpoint: "",
        dayKey,
        type: event.type,
        eventKey: event.eventKey,
        minute,
        settingsAt: prefs.updatedAt,
      };
      for (const endpoint of endpoints) {
        const body = JSON.stringify({ ...payload, endpoint });
        messages.push({
          destination: deliverUrl,
          body,
          notBefore,
          deduplicationId: reminderDedupeId([
            "reminder",
            endpoint,
            dayKey,
            event.type,
            event.eventKey,
            minute,
          ]),
        });
      }
    }
  }

  return messages;
}

async function claimDelivery(
  db: any,
  userId: string,
  dayKey: string,
  type: string,
  eventKey: string,
): Promise<boolean> {
  const key = `${userId}:${dayKey}:${type}:${eventKey}`;
  try {
    const result = await db.collection("scheduled_push_sent").updateOne(
      { _id: key },
      {
        $setOnInsert: {
          userId,
          key,
          day: dayKey,
          type,
          eventKey,
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

async function releaseClaim(
  db: any,
  userId: string,
  dayKey: string,
  type: string,
  eventKey: string,
) {
  try {
    await db
      .collection("scheduled_push_sent")
      .deleteOne({ _id: `${userId}:${dayKey}:${type}:${eventKey}` });
  } catch {}
}

async function expectedMinuteFor(
  payload: ReminderPayload,
  prefs: ReminderPrefs,
): Promise<number | null> {
  if (payload.type === "votd") return VOTD_MINUTE;
  if (payload.type === "reading") return parseTime(prefs.readingTime);
  if (payload.type === "prayer" || payload.type === "prayer-advance") {
    const cache = new Map<string, SunMinutes>();
    const sun = await fetchSunMinutes(prefs.lat, prefs.lng, payload.dayKey, prefs.tzOffset, cache);
    const base = prayerMinutes(sun)[payload.eventKey];
    if (base === undefined) return null;
    return payload.type === "prayer" ? base : base - prefs.advanceMinutes;
  }
  return null;
}

async function composeReminder(
  payload: ReminderPayload,
  prefs: ReminderPrefs,
): Promise<{ title: string; body: string; data: Record<string, unknown> } | null> {
  const label = PRAYER_LABELS[payload.eventKey] ?? payload.eventKey;
  if (payload.type === "prayer") {
    return {
      title: `Prayer time · ${label}`,
      body: PRAYER_PROMPTS[payload.eventKey] || "It is prayer time. Pause and seek Him.",
      data: { route: "/", prayer: payload.eventKey, prayerKey: payload.eventKey },
    };
  }
  if (payload.type === "prayer-advance") {
    return {
      title: `Prayer in ${prefs.advanceMinutes} min · ${label}`,
      body: ADVANCE_PROMPTS[payload.eventKey] || "Your prayer time is coming up.",
      data: {
        route: "/",
        prayer: payload.eventKey,
        prayerKey: payload.eventKey,
        advance: true,
        advanceMinutes: prefs.advanceMinutes,
      },
    };
  }
  if (payload.type === "votd") {
    return {
      title: "Verse of the Day",
      body: await getVotdBody(payload.dayKey),
      data: { route: "/", votdReminder: true },
    };
  }
  if (payload.type === "reading") {
    return {
      title: "Time to read today's magazine",
      body: "Your club reading is waiting — open today's study when you're ready.",
      data: { route: "/library", readingReminder: true },
    };
  }
  return null;
}

export async function deliverReminder(payload: ReminderPayload): Promise<DeliverResult> {
  const { userId, endpoint, dayKey, type, eventKey, minute } = payload;
  if (!userId || !endpoint || !/^\d{4}-\d{2}-\d{2}$/.test(dayKey) || !type) {
    return { status: "skipped", reason: "invalid payload" };
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 1439) {
    return { status: "skipped", reason: "invalid payload" };
  }

  const db = await getDb();
  const subscriptionDoc = await db
    .collection(WEB_PUSH_COLLECTION)
    .findOne({ userId, endpoint });
  if (!subscriptionDoc) return { status: "skipped", reason: "no subscription" };
  const subscription = toWebPushSubscription(subscriptionDoc);
  if (!subscription) return { status: "skipped", reason: "no subscription" };

  const prefsDoc = await db.collection("user_prayer_preferences").findOne({ userId });
  const prefs = normalizePrefs(prefsDoc);

  if (!prefs.enabled) return { status: "skipped", reason: "disabled" };
  if (
    (type === "prayer" || type === "prayer-advance") &&
    prefs.disabled.has(eventKey)
  ) {
    return { status: "skipped", reason: "disabled" };
  }
  if (type === "prayer-advance" && prefs.advanceMinutes <= 0) {
    return { status: "skipped", reason: "disabled" };
  }
  if (type === "votd" && !prefs.votdEnabled) return { status: "skipped", reason: "disabled" };
  if (type === "reading" && !prefs.readingEnabled) {
    return { status: "skipped", reason: "disabled" };
  }

  // Settings changed after the queue was planned (e.g. new location or
  // reading time): only send when the prayer still fires at the planned
  // minute, otherwise the queued time is stale.
  if (prefs.updatedAt !== payload.settingsAt) {
    const expected = await expectedMinuteFor(payload, prefs);
    if (expected === null || expected !== minute) {
      return { status: "skipped", reason: "rescheduled" };
    }
  }

  const message = await composeReminder(payload, prefs);
  if (!message) return { status: "skipped", reason: "unknown type" };

  const claimed = await claimDelivery(db, userId, dayKey, type, eventKey);
  if (!claimed) return { status: "skipped", reason: "already sent" };

  const sent = await sendWebPushToSubscriptions(
    [subscription],
    message.title,
    message.body,
    { ...message.data, scheduled: true },
  );
  if (sent > 0) return { status: "sent" };

  const stillSubscribed = await db
    .collection(WEB_PUSH_COLLECTION)
    .findOne({ userId, endpoint });
  if (!stillSubscribed) return { status: "removed" };

  // Transient failure: drop the claim so the QStash retry can deliver it.
  await releaseClaim(db, userId, dayKey, type, eventKey);
  throw new Error("web push delivery failed");
}

export async function planAllReminderQueues(
  origin: string,
  now: Date = new Date(),
): Promise<PlanResult> {
  const db = await getDb();
  const deliverUrl = `${origin}/api/push/deliver`;
  const subDocs = await db.collection(WEB_PUSH_COLLECTION).find({}).toArray();
  const endpointsByUser = new Map<string, string[]>();
  for (const doc of subDocs) {
    const subscription = toWebPushSubscription(doc);
    if (!subscription?.userId || !subscription.endpoint) continue;
    const endpoints = endpointsByUser.get(subscription.userId) || [];
    if (!endpoints.includes(subscription.endpoint)) endpoints.push(subscription.endpoint);
    endpointsByUser.set(subscription.userId, endpoints);
  }

  const userIds = [...endpointsByUser.keys()];
  const prefsByUser = new Map<string, ReminderPrefs>();
  if (userIds.length) {
    const prefsDocs = await db
      .collection("user_prayer_preferences")
      .find({ userId: { $in: userIds } })
      .toArray();
    for (const doc of prefsDocs) {
      const userId = text((doc as any)?.userId);
      if (userId) prefsByUser.set(userId, normalizePrefs(doc as Record<string, any>));
    }
  }

  const sunCache = new Map<string, SunMinutes>();
  const messages: DelayedPublish[] = [];
  let subscriptions = 0;
  let users = 0;
  for (const [userId, endpoints] of endpointsByUser) {
    const prefs = prefsByUser.get(userId) ?? normalizePrefs(null);
    const planned = await buildUserMessages(userId, endpoints, prefs, now, deliverUrl, sunCache);
    if (!planned.length) continue;
    users++;
    subscriptions += endpoints.length;
    messages.push(...planned);
  }

  const published = await publishDelayedMessages(messages);
  return { users, subscriptions, messages: messages.length, published };
}

export async function planReminderQueueForUser(
  userId: string,
  origin: string,
  now: Date = new Date(),
): Promise<number> {
  const db = await getDb();
  const deliverUrl = `${origin}/api/push/deliver`;
  const subDocs = await db.collection(WEB_PUSH_COLLECTION).find({ userId }).toArray();
  const endpoints: string[] = [];
  for (const doc of subDocs) {
    const subscription = toWebPushSubscription(doc);
    if (subscription?.endpoint && !endpoints.includes(subscription.endpoint)) {
      endpoints.push(subscription.endpoint);
    }
  }
  if (!endpoints.length) return 0;

  const prefsDoc = await db.collection("user_prayer_preferences").findOne({ userId });
  const prefs = normalizePrefs(prefsDoc);
  const messages = await buildUserMessages(
    userId,
    endpoints,
    prefs,
    now,
    deliverUrl,
    new Map<string, SunMinutes>(),
  );
  if (!messages.length) return 0;
  return publishDelayedMessages(messages);
}
