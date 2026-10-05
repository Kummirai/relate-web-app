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

const MAX_REQUIREMENTS = 20;
const MAX_CRITERIA = 12;

type Status = "not_started" | "in_progress" | "complete";

function statusOf(checks: boolean[]): Status {
  if (checks.every(Boolean)) return "complete";
  return checks.some(Boolean) ? "in_progress" : "not_started";
}

function readTicks(body: Record<string, unknown>): boolean[][] | null {
  const rawCriteria = body.criteria;
  if (rawCriteria !== undefined) {
    if (!Array.isArray(rawCriteria) || rawCriteria.length < 1) return null;
    if (rawCriteria.length > MAX_REQUIREMENTS) return null;
    const grid: boolean[][] = [];
    for (const row of rawCriteria) {
      if (!Array.isArray(row) || row.length < 1 || row.length > MAX_CRITERIA) return null;
      if (!row.every((v) => typeof v === "boolean")) return null;
      grid.push(row as boolean[]);
    }
    return grid;
  }

  const raw = body.checks;
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > MAX_REQUIREMENTS) return null;
  if (!raw.every((v) => typeof v === "boolean")) return null;
  return (raw as boolean[]).map((c) => [c]);
}

function checksFrom(criteria: boolean[][]): boolean[] {
  return criteria.map((row) => row.length > 0 && row.every(Boolean));
}

async function readSkillId(params: Promise<{ skillId: string }>) {
  const { skillId } = await params;
  const id = String(skillId || "").trim().toLowerCase();
  if (!id || id.length < 2) return null;
  return id;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> },
) {
  try {
    const rl = rateLimit(`skill-get:${clientIp(request)}`, 60, 60_000);
    if (!rl.ok) return publicTooMany();

    const skillId = await readSkillId(params);
    if (!skillId) return publicNotFound("Unknown skill.");

    const levelId = request.nextUrl.searchParams.get("levelId")?.trim() || "";
    if (!levelId) return publicBadRequest("levelId is required.");

    const db = await getDb();
    await ensureIndexes(db);
    const session = await resolveSession(request);
    if (!session) return publicJson({ data: null }, { maxAge: 0 });

    const mine = await db.collection("skill_progress").findOne({ userId: session.id, skillId, levelId });
    if (!mine) return publicJson({ data: null }, { maxAge: 0 });

    const { _id, ...rest } = mine;
    return publicJson({ data: { ...rest, _id: String(_id) } }, { maxAge: 0 });
  } catch (e) {
    console.error("GET /api/skills/[skillId] failed", e);
    return publicError();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> },
) {
  try {
    const rl = rateLimit(`skill-post:${clientIp(request)}`, 30, 60_000);
    if (!rl.ok) return publicTooMany();

    const skillId = await readSkillId(params);
    if (!skillId) return publicNotFound("Unknown skill.");

    const session = await resolveSession(request);
    if (!session) {
      return publicJson(
        { error: "Sign in to save skill progress." },
        { status: 401, maxAge: 0 },
      );
    }

    const body = (await request.json().catch(() => ({}))) ?? {};
    const levelId = String(body.levelId || "").trim();
    if (!levelId) return publicBadRequest("levelId is required.");

    const wantsCriteria = body.criteria !== undefined || body.checks !== undefined;
    const wantsEnroll = body.enroll === true;
    if (!wantsCriteria && !wantsEnroll)
      return publicBadRequest("Nothing to save.");

    const criteria = wantsCriteria ? readTicks(body) : null;
    if (wantsCriteria && !criteria)
      return publicBadRequest("This skill's criteria could not be read.");

    const db = await getDb();
    await ensureIndexes(db);

    const existing = await db.collection("skill_progress").findOne({ userId: session.id, skillId, levelId });

    const now = new Date();
    const enrolledAt = existing?.enrolledAt ?? now;

    const checks = criteria ? checksFrom(criteria) : (existing?.checks ?? []);
    const status = criteria ? statusOf(checks) : (existing?.status ?? "not_started");
    const completedAt = criteria
      ? status === "complete"
        ? existing?.completedAt instanceof Date
          ? existing.completedAt
          : now
        : null
      : (existing?.completedAt ?? null);

    const doc = {
      userId: session.id,
      skillId,
      levelId,
      criteria: criteria ?? existing?.criteria ?? [],
      checks,
      status,
      completedAt,
      enrolledAt,
      updatedAt: now,
      ...(existing?._id ? {} : { createdAt: now }),
    };

    await db.collection("skill_progress").updateOne(
      { userId: session.id, skillId, levelId },
      {
        $set: {
          ...(criteria ? { criteria, checks, status } : {}),
          completedAt,
          enrolledAt,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    if (status === "complete" && existing?.status !== "complete") {
      getDb()
        .then((d) =>
          notifyAdmins(
            d,
            {
              type: "skill_complete",
              title: "Skill ready for sign-off",
              body: `${session.name || "A member"} finished every requirement for ${skillId} level ${levelId}.`,
              data: { skillId, levelId, userId: session.id },
            },
            session.id,
          ),
        )
        .catch((e) => console.error("[skill progress] notifyAdmins failed:", e));
    }

    return publicJson(
      { data: { ...doc, skillId, levelId } },
      { maxAge: 0, headers: rateLimitHeaders(rl) },
    );
  } catch (e) {
    console.error("POST /api/skills/[skillId] failed", e);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
