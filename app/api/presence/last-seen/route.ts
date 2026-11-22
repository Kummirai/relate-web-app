import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/lib/community-auth";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function POST(request: NextRequest) {
  const session = await resolveSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Last seen is not configured" }, { status: 500 });
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/touch_user_last_seen`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ p_user_id: session.id }),
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
