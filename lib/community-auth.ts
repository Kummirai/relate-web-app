import { NextRequest } from "next/server";
import { getDb } from "./mongodb";
import { ObjectId } from "mongodb";

export async function resolveUser(request: NextRequest): Promise<string | null> {
  let token =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }
  if (!token) return null;

  const db = await getDb();
  const session = await db.collection("session").findOne({ token });
  if (!session) return null;

  const user = await db.collection("user").findOne({ _id: new ObjectId(session.userId) });
  if (!user) return null;

  return user._id.toString();
}
