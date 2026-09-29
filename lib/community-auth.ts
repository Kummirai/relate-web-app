import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "./auth";
import { getDb } from "./mongodb";

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

/** Finds a user doc by better-auth `id` field (falling back to `_id`). */
export async function findUserById(db: any, id: string): Promise<any | null> {
  if (!id) return null;
  const byId = await db.collection("user").findOne({ id });
  if (byId) return byId;
  if (ObjectId.isValid(id)) {
    return db.collection("user").findOne({ _id: new ObjectId(id) });
  }
  return null;
}

/** Resolves the session and returns the user only when their role is "admin". */
export async function requireAdmin(request: NextRequest): Promise<ResolvedUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return null;
    const db = await getDb();
    const user = await findUserById(db, session.user.id);
    if (!user || user.role !== "admin") return null;
    return { id: session.user.id, name: session.user.name || null };
  } catch {
    return null;
  }
}

/**
 * Returns "admin" when the requester is an admin, "owner" when they own the
 * item (matched by userId, or by author name for legacy items), else null.
 */
export async function resolveAdminOrOwner(
  request: NextRequest,
  item: { userId?: string | null; author?: string | null } | null,
): Promise<"admin" | "owner" | null> {
  const session = await resolveSession(request);
  if (!session) return null;
  if (await requireAdmin(request)) return "admin";
  if (item) {
    const isOwner =
      item.userId === session.id ||
      (!item.userId && !!session.name && item.author === session.name);
    if (isOwner) return "owner";
  }
  return null;
}

/**
 * Resolves the session and returns the full user doc only when they are
 * allowed to create community groups: admins, and facilitators who have
 * completed their training.
 */
export async function requireGroupCreator(request: NextRequest): Promise<any | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return null;
    const db = await getDb();
    const user = await findUserById(db, session.user.id);
    if (!user) return null;
    if (user.role === "admin") return user;
    if (user.role === "facilitator" && user.facilitatorTrainingCompleted === true) {
      return user;
    }
    return null;
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
      db.collection("community_request_comments").createIndex({ requestId: 1, createdAt: 1 }),
      db.collection("community_group_comments").createIndex({ groupId: 1, createdAt: 1 }),
      db.collection("event_registrations").createIndex({ eventId: 1 }),
      db.collection("event_registrations").createIndex({ eventId: 1, userId: 1 }),
      db.collection("community_groups").createIndex({ createdAt: -1 }),
      db.collection("community_groups").createIndex({ inviteCode: 1 }, { unique: true, sparse: true }),
      db.collection("facilitator_applications").createIndex({ userId: 1, createdAt: -1 }),
      db.collection("facilitator_applications").createIndex({ status: 1, createdAt: -1 }),
      db.collection("community_requests").createIndex({ createdAt: -1 }),
      db.collection("help_requests").createIndex({ createdAt: -1 }),
      db.collection("help_requests").createIndex({ userId: 1, createdAt: -1 }),
      db.collection("help_requests").createIndex({ status: 1, createdAt: -1 }),
      db.collection("community_devotionals").createIndex({ createdAt: -1 }),
      db.collection("community_devotionals").createIndex({ authorId: 1 }),
      db.collection("community_skill_connections").createIndex({ skillId: 1 }),
      db.collection("community_skill_connections").createIndex({ skillId: 1, userId: 1 }, { unique: true }),
      db.collection("community_job_applications").createIndex({ jobId: 1 }),
      db.collection("community_job_applications").createIndex({ jobId: 1, userId: 1 }, { unique: true }),
      db.collection("user").createIndex({ id: 1 }),
      db.collection("push_tokens").createIndex({ userId: 1 }),
      db.collection("notifications").createIndex({ userId: 1, createdAt: -1 }),
      db.collection("notifications").createIndex({ userId: 1, read: 1 }),
      db.collection("familyrecords").createIndex({ createdAt: -1 }),
      db.collection("user_activity").createIndex({ userId: 1, createdAt: -1 }),
      db.collection("user_activity").createIndex({ type: 1, createdAt: -1 }),
      db.collection("user_bookmarks").createIndex({ userId: 1, section: 1, itemId: 1 }, { unique: true }),
      db.collection("user_bookmarks").createIndex({ userId: 1, createdAt: -1 }),
      db.collection("user_study_progress").createIndex({ userId: 1, slug: 1 }),
      db.collection("user_streaks").createIndex({ userId: 1 }),
      db.collection("reading_streaks").createIndex({ userId: 1 }),
      db.collection("user_prayer_preferences").createIndex({ userId: 1 }),
      db.collection("quiz_registrations").createIndex({ createdAt: -1 }),
      db.collection("quiz_leaderboard").createIndex({ name: 1 }),
      db.collection("bible_versions").createIndex({ version: 1 }),
      db.collection("bible_versions").createIndex({ version: 1, "verses.book": 1, "verses.chapter": 1 }),
      db.collection("financial_reports").createIndex({ createdAt: -1 }),
      db.collection("financial_reports").createIndex({ status: 1, createdAt: -1 }),
      db.collection("community_social_joins").createIndex({ userId: 1, status: 1 }),
      db.collection("community_social_joins").createIndex({ status: 1, createdAt: -1 }),
      // User admin search + listing
      db.collection("user").createIndex({ createdAt: -1 }),
      db.collection("user").createIndex({ name: 1, email: 1 }),
      // Financial report action log queries
      db.collection("familyrecords").createIndex({ "actionLog.date": 1 }),
      // Admin help request triage by assignee
      db.collection("help_requests").createIndex({ assignedTo: 1, createdAt: -1 }),
      // School grant applications
      db.collection("school_grants").createIndex({ createdAt: -1 }),
      db.collection("school_grants").createIndex({ status: 1, createdAt: -1 }),
      db.collection("school_grants").createIndex({ userId: 1, createdAt: -1 }),
      db.collection("school_grants").createIndex({ assignedTo: 1, createdAt: -1 }),
      // Study progress sorted listing
      db.collection("user_study_progress").createIndex({ userId: 1, startedAt: -1 }),
      // Financial report period lookups
      db.collection("financial_reports").createIndex({ period: 1, status: 1, createdAt: -1 }),
      // Quiz sessions sorted listing
      db.collection("quiz_sessions").createIndex({ session: 1 }, { unique: true }),
      // Interactive reading responses — one doc per user × publication × day
      db.collection("user_reading_responses").createIndex({ userId: 1, publicationId: 1, date: 1 }, { unique: true }),
      db.collection("user_reading_responses").createIndex({ userId: 1, publicationId: 1 }),
      // Club chat messages — newest-first per channel, ordered pagination
      db.collection("club_chat_messages").createIndex({ clubSlug: 1, createdAt: -1 }),
      db.collection("club_chat_messages").createIndex({ userId: 1, createdAt: -1 }),
      // Camp registrations — one open sign-up per account × edition, newest first
      db.collection("camp_registrations").createIndex({ userId: 1, campSlug: 1, edition: 1 }),
      db.collection("camp_registrations").createIndex({ createdAt: -1 }),
      // Sprout honor progress — one record per account × honor
      db.collection("honor_progress").createIndex({ userId: 1, badgeId: 1 }, { unique: true }),
      db.collection("honor_progress").createIndex({ userId: 1, status: 1, updatedAt: -1 }),
    ]);
  } catch {}
}

export async function fetchParticipants(db: any, userIds: string[]): Promise<Map<string, ParticipantUser>> {
  const map = new Map<string, ParticipantUser>();
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return map;
  // Some user docs are keyed by better-auth's `id`, others only by `_id`.
  // Match either so group/event member avatars resolve regardless of which
  // id form is stored in joinedUserIds / rsvpUserIds.
  const objIds = unique
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));
  const query: any = { $or: [{ id: { $in: unique } }] };
  if (objIds.length) query.$or.push({ _id: { $in: objIds } });
  const users = await db
    .collection("user")
    .find(query)
    .project({ id: 1, name: 1, email: 1, image: 1 })
    .toArray();
  for (const u of users) {
    const entry: ParticipantUser = {
      id: u.id || u._id?.toString() || "",
      name: u.name || "Anonymous",
      email: u.email || "",
      image: u.image || null,
    };
    if (!entry.id) continue;
    map.set(entry.id, entry);
    // Key by both forms so lookups by either id format hit.
    if (u._id) map.set(u._id.toString(), entry);
  }
  return map;
}
