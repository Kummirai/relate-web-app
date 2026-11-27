import { sendNotification, setVapidDetails } from "web-push";
import { getDb } from "./mongodb";

export const WEB_PUSH_COLLECTION = "web_push_subscriptions";
export const DEFAULT_PUSH_ICON = "/app/icons/icon-192.png";

export type WebPushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId?: string;
};

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function isWebEndpoint(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function normalizePath(value: string): string {
  let path = value.split(/[?#]/)[0];
  if (isWebEndpoint(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      path = "/";
    }
  }
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/\(([^)]+)\)/g, "");
  if (path.startsWith("/app")) return path || "/app/";
  return `/app${path === "/" ? "/" : path}`;
}

function inferPath(data: Record<string, unknown>): string {
  const reportId = text(data.reportId);
  if (reportId) return "/app/financial-report-view";
  const appraisalId = text(data.appraisalId);
  if (appraisalId) return "/app/appraisal";
  const trainingId = text(data.trainingId);
  if (trainingId) return "/app/admin/trainings";
  if (text(data.submissionId)) return "/app/onboarding-induction";

  const section = text(data.section).toLowerCase();
  const sectionPaths: Record<string, string> = {
    requests: "/app/requests",
    groups: "/app/community",
    services: "/app/services",
    jobs: "/app/skills",
    skills: "/app/skills",
    prayer: "/app/prayer-history",
    reading: "/app/library",
    admin: "/app/dashboard",
    store: "/app/store",
    clubs: "/app/clubs",
  };
  if (sectionPaths[section]) return sectionPaths[section];

  const tab = text(data.tab).toLowerCase();
  const tabPaths: Record<string, string> = {
    requests: "/app/requests",
    spiritual: "/app/community",
    community: "/app/community",
    skills: "/app/skills",
    store: "/app/store",
    library: "/app/library",
    bible: "/app/bible",
  };
  if (tabPaths[tab]) return tabPaths[tab];

  if (text(data.requestId)) return "/app/requests";
  const clubSlug = text(data.clubSlug);
  if (clubSlug) return `/app/clubs/${encodeURIComponent(clubSlug)}`;
  if (text(data.itemId)) return "/app/details";
  return "/app/";
}

export function buildAppUrl(data: Record<string, unknown> = {}): string {
  const raw = text(data.url) || text(data.route);
  const base = normalizePath(raw || inferPath(data));
  const params = new URLSearchParams();
  if (raw.includes("?")) {
    for (const [key, value] of new URLSearchParams(raw.split("?")[1])) {
      params.set(key, value);
    }
  }
  const skip = new Set(["url", "route", "title", "body", "icon", "sound", "priority", "channelId"]);
  for (const [key, value] of Object.entries(data)) {
    if (skip.has(key)) continue;
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") continue;
    const entry = text(value);
    if (entry) params.set(key, entry);
  }
  const query = params.toString();
  return `${base}${query ? `?${query}` : ""}`;
}

export function toWebPushSubscription(doc: any): WebPushSubscription | null {
  if (!doc) return null;
  const endpoint = text(doc.endpoint);
  const p256dh = text(doc.keys?.p256dh ?? doc.p256dh);
  const auth = text(doc.keys?.auth ?? doc.auth);
  if (!isWebEndpoint(endpoint) || !p256dh || !auth) return null;
  const userId = text(doc.userId);
  return { endpoint, keys: { p256dh, auth }, ...(userId ? { userId } : {}) };
}

let vapidConfigured = false;

function getWebPush() {
  const subject = text(process.env.VAPID_SUBJECT);
  const publicKey = text(process.env.VAPID_PUBLIC_KEY).replace(/\\n/g, "\n");
  const privateKey = text(process.env.VAPID_PRIVATE_KEY).replace(/\\n/g, "\n");
  if (!subject || !publicKey || !privateKey) return null;
  if (!vapidConfigured) {
    try {
      setVapidDetails(subject, publicKey, privateKey);
      vapidConfigured = true;
    } catch (error) {
      console.error("[push] invalid VAPID configuration", error);
      return null;
    }
  }
  return true;
}

async function removeStaleSubscription(endpoint: string) {
  try {
    const db = await getDb();
    await db.collection(WEB_PUSH_COLLECTION).deleteOne({ endpoint });
  } catch (error) {
    console.error("[push] failed to remove stale web subscription", error);
  }
}

async function deliverWebPush(subscription: WebPushSubscription, message: PushMessage) {
  const client = getWebPush();
  if (!client) return false;
  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    data: message.data || {},
    url: buildAppUrl(message.data || {}),
    icon: message.icon || DEFAULT_PUSH_ICON,
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await sendNotification(subscription, payload, { TTL: 43200, urgency: "normal" });
      return true;
    } catch (error: any) {
      const status = Number(error?.statusCode ?? error?.status);
      if (status === 404 || status === 410) {
        await removeStaleSubscription(subscription.endpoint);
        return false;
      }
      if (attempt === 0 && (status === 429 || status >= 500)) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        continue;
      }
      console.error("[push] web push failed", status || "", error?.message || error);
      return false;
    }
  }
  return false;
}

export async function getUserWebPushSubscriptions(
  db: any,
  userId: string,
): Promise<WebPushSubscription[]> {
  if (!userId) return [];
  const docs = await db.collection(WEB_PUSH_COLLECTION).find({ userId }).toArray();
  return docs
    .map((doc: any) => toWebPushSubscription(doc))
    .filter((sub: WebPushSubscription | null): sub is WebPushSubscription => Boolean(sub));
}

async function getWebPushEndpoints(db: any, query: Record<string, unknown>): Promise<string[]> {
  try {
    const docs = await db.collection(WEB_PUSH_COLLECTION).find(query).toArray();
    return docs
      .map((doc: any) => toWebPushSubscription(doc)?.endpoint || "")
      .filter(Boolean);
  } catch (error) {
    console.error("[push] failed to load web push endpoints", error);
    return [];
  }
}

export async function getPushTokensByUserIds(
  db: any,
  userIds: string[],
  excludeDeviceId?: string,
): Promise<Map<string, string[]>> {
  const ids = [...new Set(userIds.map((id) => String(id)).filter(Boolean))];
  const skipDevice = text(excludeDeviceId);
  const tokensByUser = new Map<string, string[]>();
  if (!ids.length) return tokensByUser;

  const addToken = (userId: string, token: string) => {
    if (!userId || !token) return;
    const tokens = tokensByUser.get(userId) || [];
    if (!tokens.includes(token)) tokens.push(token);
    tokensByUser.set(userId, tokens);
  };

  const [nativeDocs, webDocs] = await Promise.all([
    db
      .collection("push_tokens")
      .find({ userId: { $in: ids } })
      .project({ userId: 1, token: 1, deviceId: 1 })
      .toArray(),
    db.collection(WEB_PUSH_COLLECTION).find({ userId: { $in: ids } }).toArray(),
  ]);

  for (const doc of nativeDocs) {
    // The install that sent the message never notifies itself, even when a
    // stale subscription on that device is still filed under another account.
    if (skipDevice && text(doc?.deviceId) === skipDevice) continue;
    addToken(String(doc?.userId ?? ""), text(doc?.token));
  }
  for (const doc of webDocs) {
    if (skipDevice && text(doc?.deviceId) === skipDevice) continue;
    const subscription = toWebPushSubscription(doc);
    if (subscription?.userId) addToken(subscription.userId, subscription.endpoint);
  }
  return tokensByUser;
}

export async function sendWebPushToSubscriptions(
  subscriptions: WebPushSubscription[],
  title: string,
  body: string,
  data: Record<string, unknown> = {},
  icon?: string,
): Promise<number> {
  if (!getWebPush()) return 0;
  const unique = new Map<string, WebPushSubscription>();
  for (const subscription of subscriptions) {
    const normalized = toWebPushSubscription(subscription);
    if (normalized) unique.set(normalized.endpoint, normalized);
  }
  if (!unique.size) return 0;
  const results = await Promise.all(
    [...unique.values()].map((subscription) =>
      deliverWebPush(subscription, { to: subscription.endpoint, title, body, data, icon }),
    ),
  );
  return results.filter(Boolean).length;
}

export async function sendWebPushMessages(messages: PushMessage[]) {
  const targets = messages.filter((message) => isWebEndpoint(message.to));
  if (!targets.length || !getWebPush()) return;
  const db = await getDb();
  const endpoints = [...new Set(targets.map((message) => message.to))];
  const docs = await db.collection(WEB_PUSH_COLLECTION).find({ endpoint: { $in: endpoints } }).toArray();
  const subscriptions = new Map<string, WebPushSubscription>();
  for (const doc of docs) {
    const subscription = toWebPushSubscription(doc);
    if (subscription) subscriptions.set(subscription.endpoint, subscription);
  }
  await Promise.all(
    targets.map((message) => {
      const subscription = subscriptions.get(message.to);
      return subscription ? deliverWebPush(subscription, message) : Promise.resolve(false);
    }),
  );
}

/** Push tokens registered by a specific user (e.g. the owner of a request). */
export async function getUserPushTokens(db: any, userId: string): Promise<string[]> {
  if (!userId) return [];
  const tokens = await db.collection("push_tokens").find({ userId }).toArray();
  const native = tokens.map((t: any) => t.token).filter(Boolean);
  const web = await getWebPushEndpoints(db, { userId });
  return [...native, ...new Set(web)];
}

/** Push tokens of every admin user (optionally excluding one user). */
export async function getAdminPushTokens(
  db: any,
  exceptUserId?: string | null,
): Promise<string[]> {
  const admins = await db
    .collection("user")
    .find({ role: "admin" })
    .project({ id: 1, _id: 1 })
    .toArray();
  const ids = admins
    .map((a: any) => String(a.id || a._id?.toString() || ""))
    .filter((id: string) => id && id !== exceptUserId);
  if (!ids.length) return [];
  const tokens = await db.collection("push_tokens").find({ userId: { $in: ids } }).toArray();
  const native = tokens.map((t: any) => t.token).filter(Boolean);
  const web = await getWebPushEndpoints(db, { userId: { $in: ids } });
  return [...native, ...new Set(web)];
}

/** Push tokens of every user (optionally excluding one user, e.g. the author). */
export async function getAllPushTokens(
  db: any,
  exceptUserId?: string | null,
): Promise<string[]> {
  const users = await db
    .collection("user")
    .find({})
    .project({ id: 1, _id: 1 })
    .toArray();
  const ids = users
    .map((u: any) => String(u.id || u._id?.toString() || ""))
    .filter((id: string) => id && id !== exceptUserId);
  if (!ids.length) return [];
  const tokens = await db.collection("push_tokens").find({ userId: { $in: ids } }).toArray();
  const native = tokens.map((t: any) => t.token).filter(Boolean);
  const web = await getWebPushEndpoints(db, { userId: { $in: ids } });
  return [...native, ...new Set(web)];
}

/**
 * Android: every remote notification must land on a channel that exists on
 * the device. The app creates a HIGH-importance "requests" channel at
 * startup (banners + sound); sending channelId here routes these pushes to it
 * instead of the silent fallback channel. Ignored by iOS (APNs uses `sound`).
 */
export const DEFAULT_PUSH_CHANNEL_ID = "requests";

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
  icon?: string;
};

/**
 * Sends pre-built messages (different title/body per recipient) through the
 * Expo push API in chunks of 100. Must be awaited by the caller — on serverless
 * runtimes (Vercel) un-awaited promises are frozen once the response is flushed.
 */
export async function sendPushMessages(messages: PushMessage[]) {
  const valid = messages.filter((message) => message.to);
  if (!valid.length) return;
  const native = valid.filter((message) => !isWebEndpoint(message.to));
  if (native.length) {
    const payload = native.map((message) => ({
      to: message.to,
      title: message.title,
      body: message.body,
      sound: "default",
      priority: "high",
      channelId: message.channelId || DEFAULT_PUSH_CHANNEL_ID,
      data: message.data || {},
    }));
    const CHUNK = 100;
    try {
      for (let i = 0; i < payload.length; i += CHUNK) {
        const res = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload.slice(i, i + CHUNK)),
        });
        if (!res.ok) {
          const errorText = await res.text().catch(() => "");
          console.error(`[push] Expo API ${res.status}: ${errorText.slice(0, 500)}`);
        }
      }
    } catch (error) {
      console.error("[push] Expo send failed", error);
    }
  }
  await sendWebPushMessages(valid);
}

/**
 * Delivery via the Expo push API. The API accepts at most 100 messages per
 * request, so large broadcasts (e.g. "notify all users") are sent in chunks.
 * Must be awaited by the caller — on serverless runtimes (Vercel) un-awaited
 * promises are frozen once the response is flushed.
 */
export async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, unknown> = {},
  channelId: string = DEFAULT_PUSH_CHANNEL_ID,
) {
  const unique = [...new Set(tokens.filter(Boolean))];
  if (!unique.length) return;
  await sendPushMessages(
    unique.map((to) => ({ to, title, body, data, channelId })),
  );
}
