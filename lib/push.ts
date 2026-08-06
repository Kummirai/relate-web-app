import { getDb } from "./mongodb";

/** Push tokens registered by a specific user (e.g. the owner of a request). */
export async function getUserPushTokens(db: any, userId: string): Promise<string[]> {
  if (!userId) return [];
  const tokens = await db.collection("push_tokens").find({ userId }).toArray();
  return tokens.map((t: any) => t.token).filter(Boolean);
}

/** Push tokens of every admin user. */
export async function getAdminPushTokens(db: any): Promise<string[]> {
  const admins = await db
    .collection("user")
    .find({ role: "admin" })
    .project({ id: 1, _id: 1 })
    .toArray();
  const ids = admins
    .map((a: any) => String(a.id || a._id?.toString() || ""))
    .filter(Boolean);
  if (!ids.length) return [];
  const tokens = await db.collection("push_tokens").find({ userId: { $in: ids } }).toArray();
  return tokens.map((t: any) => t.token).filter(Boolean);
}

/** Fire-and-forget delivery via the Expo push API. */
export async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) {
  const unique = [...new Set(tokens.filter(Boolean))];
  if (!unique.length) return;
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        unique.map((to) => ({ to, title, body, sound: "default", data })),
      ),
    });
  } catch {}
}
