import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "./auth";
import { getDb } from "./mongodb";

export type ResolvedUser = { id: string; name: string | null };

const sessionByRequest = new WeakMap<NextRequest, Promise<any>>();

function getSession(request: NextRequest): Promise<any> {
  const pending = sessionByRequest.get(request);
  if (pending) return pending;
  const next = auth.api.getSession({ headers: request.headers }).catch((err) => {
    sessionByRequest.delete(request);
    throw err;
  });
  sessionByRequest.set(request, next);
  return next;
}

export async function resolveUser(request: NextRequest): Promise<string | null> {
  try {
    const session = await getSession(request);
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
    const session = await getSession(request);
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
 * allowed to create community groups — admins only (the old facilitator
 * role gate was retired).
 */
export async function requireGroupCreator(request: NextRequest): Promise<any | null> {
  try {
    const session = await getSession(request);
    if (!session?.user) return null;
    const db = await getDb();
    const user = await findUserById(db, session.user.id);
    if (!user) return null;
    if (user.role === "admin") return user;
    return null;
  } catch {
    return null;
  }
}

export async function resolveSession(request: NextRequest): Promise<ResolvedUser | null> {
  try {
    const session = await getSession(request);
    if (!session?.user) return null;
    return { id: session.user.id, name: session.user.name || null };
  } catch {
    return null;
  }
}

export type ParticipantUser = { id: string; name: string; email: string; image: string | null };

export async function ensureIndexes(_db: any) {}

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
