import { NextRequest } from "next/server";
import { auth } from "./auth";
import { getDb } from "./mongodb";

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

/**
 * Validate the request by extracting the Bearer token from the Authorization
 * header, looking up the session directly in the database, and checking the
 * user's admin role.
 *
 * This approach is used instead of auth.api.getSession() because the mobile
 * app sends a Bearer token (not a session cookie), and Better Auth's
 * getSession with the nextCookies() plugin does not reliably extract Bearer
 * tokens from the Authorization header in Next.js API route handlers.
 */
export async function requireAdminViaBearerToken(
  request: NextRequest,
): Promise<string | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);

    const db = await getDb();

    // Look up the session by token
    const session = await db.collection("session").findOne({ token });
    if (!session) return null;

    // Check if the session has expired
    if (new Date(session.expiresAt) < new Date()) return null;

    // Look up the user by their string `id` field (nanoid/UUID, NOT ObjectId)
    const user = await db
      .collection("user")
      .findOne({ id: session.userId });
    if (!user || user.role !== "admin") return null;

    return session.userId;
  } catch {
    return null;
  }
}
