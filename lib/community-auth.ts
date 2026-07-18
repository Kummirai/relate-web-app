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
