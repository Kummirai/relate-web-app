import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/community-auth";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const MASTER_ACCOUNT_EMAIL = "info@relateworld.org";

type MasterAccountRow = {
  id: string;
  account_type?: string;
  display_name?: string | null;
  balance?: number | string | null;
  is_master?: boolean;
};

async function loadMasterAccount(userId: string | null) {
  if (!userId) return null;
  const url = new URL(`${SUPABASE_URL}/rest/v1/accounts`);
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("limit", "10");

  // Older Smart Saver schemas have no balance column — fall back to the
  // identity-only select so the account is still reported.
  for (const select of [
    "id,account_type,display_name,balance,is_master",
    "id,account_type,display_name",
  ]) {
    const requestUrl = new URL(url);
    requestUrl.searchParams.set("select", select);
    const response = await fetch(requestUrl, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) continue;
    const rows = (await response.json()) as MasterAccountRow[];
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return (
      rows.find((row) => row.is_master === true) ??
      rows.find((row) => row.account_type === "relate") ??
      rows[0]
    );
  }
  return null;
}

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

  // Relate World settles from the account owned by info@relateworld.org, so
  // resolve it by owner rather than taking whichever row carries is_master.
  const masterOwner = authUsers.find(
    (authUser) =>
      typeof authUser.email === "string" &&
      authUser.email.toLowerCase() === MASTER_ACCOUNT_EMAIL,
  );
  const master = await loadMasterAccount(
    masterOwner ? String(masterOwner.id) : null,
  );
  if (!master) {
    console.warn(
      "[smart-saver accounts] no Smart Saver account found for",
      MASTER_ACCOUNT_EMAIL,
    );
  }

  const recipientAccounts = (rows as Record<string, unknown>[]).filter(
    (row): row is Record<string, unknown> =>
      typeof row === "object" &&
      row !== null &&
      row.is_master !== true &&
      row.id !== master?.id &&
      row.user_id !== null &&
      row.account_type === "relate",
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
  const balance = Number(master?.balance);
  const masterBalance = master && Number.isFinite(balance) ? balance : null;
  const masterAccount = master
    ? {
        id: master.id,
        display_name: master.display_name ?? null,
        owner_email: MASTER_ACCOUNT_EMAIL,
        is_master: master.is_master ?? null,
      }
    : null;
  if (!accountIdentifier) {
    return NextResponse.json({ data: enrichedAccounts, masterBalance, masterAccount });
  }
  if (enrichedAccounts.length !== 1) {
    return NextResponse.json(
      { error: "No Smart Saver account found for that number or code" },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: enrichedAccounts[0], masterBalance, masterAccount });
}
