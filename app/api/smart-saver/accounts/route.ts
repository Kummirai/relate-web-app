import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/community-auth";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const clubCode = request.nextUrl.searchParams.get("clubCode")?.trim();
  const accountNumber = request.nextUrl.searchParams.get("accountNumber")?.trim();
  const accountIdentifier = accountNumber || clubCode;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Smart Saver account service is not configured" }, { status: 500 });
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/accounts`);
  url.searchParams.set("select", "id,display_name,club_slug,club_code,account_number");
  if (accountNumber) {
    url.searchParams.set("account_number", `eq.${accountNumber.toUpperCase()}`);
  } else if (clubCode) {
    url.searchParams.set("club_code", `eq.${clubCode}`);
  }
  url.searchParams.set("account_type", "eq.relate");
  url.searchParams.set("is_master", "eq.false");
  url.searchParams.set("limit", accountIdentifier ? "1" : "200");
  url.searchParams.set("order", "created_at.desc");

  const response = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const rows = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: "Account lookup failed" }, { status: 502 });
  }
  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: "Account lookup failed" }, { status: 502 });
  }
  if (!accountIdentifier) {
    return NextResponse.json({ data: rows });
  }
  if (rows.length !== 1) {
    return NextResponse.json({ error: "No Relate account found for that code" }, { status: 404 });
  }
  return NextResponse.json({ data: rows[0] });
}
