import { getDb } from "./mongodb";

export type InAppNotificationInput = {
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

/** Inserts a notification for a single user. */
export async function createNotification(
  db: any,
  userId: string | null | undefined,
  input: InAppNotificationInput,
) {
  if (!userId) return;
  try {
    await db.collection("notifications").insertOne({
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data || {},
      read: false,
      createdAt: new Date(),
    });
  } catch {}
}

/** Inserts a notification for every admin user (optionally excluding one user). */
export async function notifyAdmins(
  db: any,
  input: InAppNotificationInput,
  exceptUserId?: string | null,
) {
  try {
    const admins = await db
      .collection("user")
      .find({ role: "admin" })
      .project({ id: 1, _id: 1 })
      .toArray();
    const ids = admins
      .map((a: any) => String(a.id || a._id?.toString() || ""))
      .filter((id: string) => id && id !== exceptUserId);
    if (!ids.length) return;
    const docs = ids.map((userId: string) => ({
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data || {},
      read: false,
      createdAt: new Date(),
    }));
    await db.collection("notifications").insertMany(docs);
  } catch {}
}
