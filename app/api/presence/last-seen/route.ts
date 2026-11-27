import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/lib/community-auth";
import { withCpuTiming } from "@/lib/api-timing";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function handlePost(request: NextRequest) {
  const session = await resolveSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Last seen is not configured" }, { status: 500 });
  }

  // Upsert the row through PostgREST rather than the touch_user_last_seen RPC:
  // the RPC was never deployed to the project, and the phone heartbeats at most
  // every five minutes, so an unconditional write is cheap enough.
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/user_last_seen?on_conflict=user_id`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        user_id: session.id,
        last_seen_at: new Date().toISOString(),
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const result = await response.text();
    console.error("[presence/last-seen] failed:", result);
    return NextResponse.json(
      { error: "Could not update last seen" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

export const POST = withCpuTiming("presence/last-seen.POST", handlePost);
