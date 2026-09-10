import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { findUserById } from "@/lib/community-auth";

export type ServerUser = { id: string; name: string | null; email: string | null };

/** Inline user doc from the current request's session, if any. */
export async function getServerUser(): Promise<ServerUser | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;
    return { id: session.user.id, name: session.user.name || null, email: session.user.email || null };
  } catch {
    return null;
  }
}

/** Returns the current user only when their role is admin. */
export async function getServerAdmin(): Promise<ServerUser | null> {
  const user = await getServerUser();
  if (!user) return null;
  try {
    const db = await getDb();
    const doc = await findUserById(db, user.id);
    if (!doc || doc.role !== "admin") return null;
    return user;
  } catch {
    return null;
  }
}

/** Guards an admin page — redirects to /unauthorized when not an admin. */
export async function requireServerAdmin() {
  const admin = await getServerAdmin();
  if (!admin) redirect("/unauthorized");
  return admin;
}