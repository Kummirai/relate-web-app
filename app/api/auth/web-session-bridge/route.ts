import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

/**
 * Expires a one-time OAuth session-bridge token.
 *
 * POST /api/auth/web-session-bridge  { token }
 * Verifies and consumes the token the web-session-bridge auth hook appended
 * to a cross-origin OAuth redirect, then hands back the session cookie the
 * web app should re-issue on its own domain.
 */
let ttlEnsured = false;

async function ensureBridgeIndex(db: any) {
  if (ttlEnsured) return;
  ttlEnsured = true;
  try {
    await db
      .collection("bridge_tokens")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 120 });
  } catch {
    // Index creation is best-effort; the query still filters by expiresAt.
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token : "";
    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    const db = await getDb();
    await ensureBridgeIndex(db);

    const doc = await db.collection("bridge_tokens").findOne({
      token,
      expiresAt: { $gt: new Date() },
    });
    if (!doc) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Delete first so a replayed or leaked token can only be redeemed once.
    const result = await db.collection("bridge_tokens").deleteOne({ token });
    if (result.deletedCount !== 1) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    return NextResponse.json({ success: true, cookie: doc.cookie });
  } catch {
    return NextResponse.json({ error: "Failed to exchange token" }, { status: 500 });
  }
}