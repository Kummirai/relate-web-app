import { NextRequest } from "next/server";
import { auth } from "./auth";

export type ResolvedUser = { id: string; name: string | null };

export async function resolveUser(request: NextRequest): Promise<string | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return null;
    return session.user.id;
  } catch {
    return null;
  }
}

export async function resolveSession(request: NextRequest): Promise<ResolvedUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return null;
    return { id: session.user.id, name: session.user.name || null };
  } catch {
    return null;
  }
}

export type ParticipantUser = { id: string; name: string; email: string; image: string | null };

let indexesEnsured = false;

export async function ensureIndexes(db: any) {
  if (indexesEnsured) return;
  indexesEnsured = true;
  try {
    await Promise.all([
      db.collection("community_skills").createIndex({ createdAt: -1 }),
      db.collection("community_jobs").createIndex({ createdAt: -1 }),
      db.collection("community_events").createIndex({ createdAt: -1 }),
      db.collection("community_groups").createIndex({ createdAt: -1 }),
      db.collection("community_requests").createIndex({ createdAt: -1 }),
      db.collection("community_devotionals").createIndex({ createdAt: -1 }),
      db.collection("community_devotionals").createIndex({ authorId: 1 }),
      db.collection("community_skill_connections").createIndex({ skillId: 1 }),
      db.collection("community_skill_connections").createIndex({ skillId: 1, userId: 1 }, { unique: true }),
      db.collection("community_job_applications").createIndex({ jobId: 1 }),
      db.collection("community_job_applications").createIndex({ jobId: 1, userId: 1 }, { unique: true }),
      db.collection("user").createIndex({ id: 1 }),
      db.collection("user_activity").createIndex({ userId: 1, createdAt: -1 }),
      db.collection("user_bookmarks").createIndex({ userId: 1, section: 1, itemId: 1 }, { unique: true }),
    ]);
  } catch {}
}

export async function fetchParticipants(db: any, userIds: string[]): Promise<Map<string, ParticipantUser>> {
  const map = new Map<string, ParticipantUser>();
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return map;
  const users = await db
    .collection("user")
    .find({ id: { $in: unique } })
    .project({ id: 1, name: 1, email: 1, image: 1 })
    .toArray();
  for (const u of users) {
    const uid = u.id || u._id?.toString() || "";
    if (uid) map.set(uid, { id: uid, name: u.name || "Anonymous", email: u.email || "", image: u.image || null });
  }
  return map;
}
