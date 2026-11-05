import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/community-auth";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const accountId = typeof body.accountId === "string" ? body.accountId.trim() : "";
  const amount = Number(body.amount);
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!accountId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Valid account and amount are required" },
      { status: 400 },
    );
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Smart Saver settlement is not configured" },
      { status: 500 },
    );
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/relate_settle_account`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_destination_account_id: accountId,
      p_amount: amount,
      p_description: description || "Relate World payment",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const result = await response.text();
    console.error("[smart-saver settlement] failed:", result);
    return NextResponse.json({ error: "Settlement failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
