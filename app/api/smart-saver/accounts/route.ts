import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/community-auth";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Smart Saver account service is not configured" },
      { status: 500 },
    );
  }

  const clubCode = request.nextUrl.searchParams.get("clubCode")?.trim();
  const accountNumber = request.nextUrl.searchParams.get("accountNumber")?.trim();
  const accountIdentifier = accountNumber || clubCode;
  const url = new URL(`${SUPABASE_URL}/rest/v1/accounts`);
  url.searchParams.set(
    "select",
    "id,user_id,account_type,display_name,club_slug,club_code,account_number,is_master",
  );
  if (accountNumber) {
    url.searchParams.set("account_number", `eq.${accountNumber.toUpperCase()}`);
  } else if (clubCode) {
    url.searchParams.set("club_code", `eq.${clubCode}`);
  }
  url.searchParams.set("limit", accountIdentifier ? "1" : "200");

  const fetchAccounts = async (select: string) => {
    const requestUrl = new URL(url);
    requestUrl.searchParams.set("select", select);
    return fetch(requestUrl, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  };

  let response = await fetchAccounts(
    "id,user_id,account_type,display_name,club_slug,club_code,account_number,is_master",
  );
  let text = await response.text();
  let rows: unknown;

  if (!response.ok) {
    let fallbackResponse = await fetchAccounts(
      "id,user_id,account_type,display_name,club_slug,club_code",
    );
    if (fallbackResponse.ok) {
      response = fallbackResponse;
      text = await response.text();
    } else {
      try {
        rows = text ? JSON.parse(text) : null;
      } catch {
        rows = { message: text.slice(0, 300) };
      }
      console.error("[smart-saver accounts] lookup failed", response.status, rows);
      return NextResponse.json(
        { error: "Account lookup failed", details: rows },
        { status: 502 },
      );
    }
  }
  try {
    rows = text ? JSON.parse(text) : null;
  } catch {
    rows = { message: text.slice(0, 300) };
  }
  if (!response.ok || !Array.isArray(rows)) {
    console.error("[smart-saver accounts] lookup failed", response.status, rows);
    return NextResponse.json(
      { error: "Account lookup failed", details: rows },
      { status: 502 },
    );
  }
  const recipientAccounts = (rows as Record<string, unknown>[]).filter(
    (row): row is Record<string, unknown> =>
      typeof row === "object" &&
      row !== null &&
      row.is_master !== true &&
      row.user_id !== null,
  );
  if (!accountIdentifier) return NextResponse.json({ data: recipientAccounts });
  if (recipientAccounts.length !== 1) {
    return NextResponse.json(
      { error: "No Smart Saver account found for that number or code" },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: recipientAccounts[0] });
}
