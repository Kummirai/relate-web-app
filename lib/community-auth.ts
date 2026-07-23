import { NextRequest } from "next/server";
import { auth } from "./auth";

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

export type ParticipantUser = { id: string; name: string; email: string; image: string | null };

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
