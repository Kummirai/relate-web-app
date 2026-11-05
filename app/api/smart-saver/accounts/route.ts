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
      row.user_id !== null &&
      row.account_type === "relate",
  );

  const authResponse = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );
  let authUsers: Array<Record<string, unknown>> = [];
  if (authResponse.ok) {
    const authBody = await authResponse.json();
    authUsers = Array.isArray(authBody) ? authBody : (authBody.users ?? []);
  }
  const usersById = new Map(
    authUsers.map((authUser) => [String(authUser.id), authUser]),
  );
  const enrichedAccounts = recipientAccounts.map((account) => {
    const authUser = usersById.get(String(account.user_id));
    const metadata =
      typeof authUser?.user_metadata === "object" && authUser.user_metadata !== null
        ? (authUser.user_metadata as Record<string, unknown>)
        : {};
    const name =
      [metadata.full_name, metadata.name, metadata.display_name]
        .find((value) => typeof value === "string" && value.trim()) || null;
    return {
      ...account,
      owner_name: typeof name === "string" ? name : null,
      owner_email:
        typeof authUser?.email === "string" ? authUser.email : null,
    };
  });
  const masterUrl = new URL(`${SUPABASE_URL}/rest/v1/accounts`);
  masterUrl.searchParams.set("select", "id,balance,account_number,is_master");
  masterUrl.searchParams.set("is_master", "eq.true");
  masterUrl.searchParams.set("limit", "1");
  const masterResponse = await fetch(masterUrl, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  let masterBalance: number | null = null;
  if (masterResponse.ok) {
    const masterText = await masterResponse.text();
    try {
      const masters = JSON.parse(masterText) as Array<{ balance?: number | string }>;
      if (masters.length === 1 && masters[0].balance !== undefined) {
        const balance = Number(masters[0].balance);
        if (Number.isFinite(balance)) masterBalance = balance;
      }
    } catch {
      masterBalance = null;
    }
  }
  if (!accountIdentifier) {
    return NextResponse.json({ data: enrichedAccounts, masterBalance });
  }
  if (enrichedAccounts.length !== 1) {
    return NextResponse.json(
      { error: "No Smart Saver account found for that number or code" },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: enrichedAccounts[0], masterBalance });
}
