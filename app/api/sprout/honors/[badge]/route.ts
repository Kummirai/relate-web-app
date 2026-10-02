import { NextRequest } from "next/server";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";
import {
  publicBadRequest,
  publicError,
  publicJson,
  publicNotFound,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { resolveSession, ensureIndexes } from "@/lib/community-auth";
import { getDb } from "@/lib/mongodb";
import { notifyAdmins } from "@/lib/inapp-notify";

/**
 * Sprout honor progress — /api/sprout/honors/[badge]
 *
 *   GET  → the caller's own record for that honor (or null)
 *   POST → { enroll: true } open the record so progress can be filled in,
 *          and/or { criteria: boolean[][] } tick off the measurable criteria
 *          of each requirement as they are proven, and/or { deposit: number }
 *          to bank an amount in the honor's piggy bank.
 *
 * One record per account per honor. Every requirement's criteria are ticked →
 * that requirement is proven; all requirements proven → the record flips to
 * "complete" and leaders are notified in-app to confirm and award the badge.
 * The derived requirement-level `checks` array is stored alongside so older
 * readers keep working.
 */

const BADGE_RE = /^[a-z0-9-]{2,60}$/;
const MAX_REQUIREMENTS = 20;
const MAX_CRITERIA = 12;
/** Piggy-bank ceiling in rand — one participant's savings on a single honor. */
const MAX_SAVINGS = 10_000;

type Status = "not_started" | "in_progress" | "complete";

function statusOf(checks: boolean[]): Status {
  if (checks.every(Boolean)) return "complete";
  return checks.some(Boolean) ? "in_progress" : "not_started";
}

/** Reads the posted criteria grid, or the legacy requirement-level ticks. */
function readTicks(body: Record<string, unknown>): boolean[][] | null {
  const rawCriteria = body.criteria;
  if (rawCriteria !== undefined) {
    if (!Array.isArray(rawCriteria) || rawCriteria.length < 1)
      return null;
    if (rawCriteria.length > MAX_REQUIREMENTS) return null;
    const grid: boolean[][] = [];
    for (const row of rawCriteria) {
      if (!Array.isArray(row) || row.length < 1 || row.length > MAX_CRITERIA)
        return null;
      if (!row.every((v) => typeof v === "boolean")) return null;
      grid.push(row as boolean[]);
    }
    return grid;
  }

  const raw = body.checks;
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > MAX_REQUIREMENTS)
    return null;
  if (!raw.every((v) => typeof v === "boolean")) return null;
  return (raw as boolean[]).map((c) => [c]);
}

/** A requirement counts as proven only when every one of its ticks is set. */
function checksFrom(criteria: boolean[][]): boolean[] {
  return criteria.map((row) => row.length > 0 && row.every(Boolean));
}

async function readBadge(params: Promise<{ badge: string }>) {
  const { badge } = await params;
  const badgeId = String(badge || "").trim().toLowerCase();
  if (!BADGE_RE.test(badgeId)) return null;
  return badgeId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ badge: string }> },
) {
  try {
    const rl = rateLimit(`honor-get:${clientIp(request)}`, 60, 60_000);
    if (!rl.ok) return publicTooMany();

    const badgeId = await readBadge(params);
    if (!badgeId) return publicNotFound("Unknown honor.");

    const db = await getDb();
    await ensureIndexes(db);
    const session = await resolveSession(request);
    if (!session) return publicJson({ data: null }, { maxAge: 0 });

    const mine = await db
      .collection("honor_progress")
      .findOne({ userId: session.id, badgeId });
    if (!mine) return publicJson({ data: null }, { maxAge: 0 });

    const { _id, ...rest } = mine;
    return publicJson({ data: { ...rest, _id: String(_id) } }, { maxAge: 0 });
  } catch (e) {
    console.error("GET /api/sprout/honors/[badge] failed", e);
    return publicError();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ badge: string }> },
) {
  try {
    const rl = rateLimit(`honor-post:${clientIp(request)}`, 30, 60_000);
    if (!rl.ok) return publicTooMany();

    const badgeId = await readBadge(params);
    if (!badgeId) return publicNotFound("Unknown honor.");

    const session = await resolveSession(request);
    if (!session) {
      return publicJson(
        { error: "Sign in to save honor progress." },
        { status: 401, maxAge: 0 },
      );
    }

    const body = (await request.json().catch(() => ({}))) ?? {};
    const wantsCriteria =
      body.criteria !== undefined || body.checks !== undefined;
    const wantsDeposit = body.deposit !== undefined;
    const wantsEnroll = body.enroll === true;
    if (!wantsCriteria && !wantsDeposit && !wantsEnroll)
      return publicBadRequest("Nothing to save.");

    const criteria = wantsCriteria ? readTicks(body) : null;
    if (wantsCriteria && !criteria)
      return publicBadRequest("That honor's criteria could not be read.");

    let deposit: number | null = null;
    if (wantsDeposit) {
      const raw = body.deposit;
      if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0)
        return publicBadRequest("Enter a positive amount to save.");
      deposit = Math.round(raw * 100) / 100;
      if (deposit > MAX_SAVINGS)
        return publicBadRequest(
          `The piggy bank holds up to R${MAX_SAVINGS.toLocaleString("en-ZA")}.`,
        );
    }

    const db = await getDb();
    await ensureIndexes(db);

    const existing = await db
      .collection("honor_progress")
      .findOne({ userId: session.id, badgeId });

    const now = new Date();
    /** First touch of the record (enroll or first write) opens it. */
    const enrolledAt = existing?.enrolledAt ?? now;

    const prevSavings = existing?.savings;
    const prevTotal =
      typeof prevSavings?.total === "number" ? prevSavings.total : 0;
    const prevDeposits = Array.isArray(prevSavings?.deposits)
      ? prevSavings.deposits
      : [];
    if (deposit !== null && prevTotal + deposit > MAX_SAVINGS)
      return publicBadRequest(
        `That would take the piggy bank past R${MAX_SAVINGS.toLocaleString("en-ZA")}.`,
      );
    const savings =
      deposit !== null
        ? {
            total: Math.round((prevTotal + deposit) * 100) / 100,
            deposits: [...prevDeposits, { amount: deposit, at: now }],
          }
        : { total: prevTotal, deposits: prevDeposits };

    const checks = criteria
      ? checksFrom(criteria)
      : (existing?.checks ?? []);
    const status = criteria
      ? statusOf(checks)
      : (existing?.status ?? "not_started");
    const completedAt = criteria
      ? status === "complete"
        ? existing?.completedAt instanceof Date
          ? existing.completedAt
          : now
        : null
      : (existing?.completedAt ?? null);

    const doc = {
      userId: session.id,
      badgeId,
      criteria: criteria ?? existing?.criteria ?? [],
      checks,
      status,
      savings,
      completedAt,
      enrolledAt,
      updatedAt: now,
      ...(existing?._id ? {} : { createdAt: now }),
    };

    await db
      .collection("honor_progress")
      .updateOne(
        { userId: session.id, badgeId },
        {
          $set: {
            ...(criteria ? { criteria, checks, status } : {}),
            savings,
            completedAt,
            enrolledAt,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );

    // First time every requirement is ticked — tell the leaders so the badge
    // can be confirmed and awarded.
    if (status === "complete" && existing?.status !== "complete") {
      getDb()
        .then((d) =>
          notifyAdmins(
            d,
            {
              type: "honor_complete",
              title: "Honor ready for sign-off",
              body: `${session.name || "A Sprout member"} finished every requirement for the ${badgeId} honor.`,
              data: { badgeId, userId: session.id },
            },
            session.id,
          ),
        )
        .catch((e) => console.error("[honor progress] notifyAdmins failed:", e));
    }

    return publicJson(
      { data: { ...doc, badgeId } },
      { maxAge: 0, headers: rateLimitHeaders(rl) },
    );
  } catch (e) {
    console.error("POST /api/sprout/honors/[badge] failed", e);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
