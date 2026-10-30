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

/**
 * Student-facing skill progress.
 *
 * GET  — the signed-in member's saved row for a level.
 * POST — enrollment only. Criteria are marked complete by an instructor from
 *        the admin skills screen (`POST /api/admin/skills`), so students get a
 *        read-only progress view.
 */

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

    if (body.criteria !== undefined || body.checks !== undefined) {
      return publicJson(
        {
          error:
            "Your instructor marks criteria complete — you can still enroll to track this level.",
        },
        { status: 403, maxAge: 0 },
      );
    }

    if (body.enroll !== true) return publicBadRequest("Nothing to save.");

    const db = await getDb();
    await ensureIndexes(db);

    const existing = await db.collection("skill_progress").findOne({ userId: session.id, skillId, levelId });
    const now = new Date();
    const enrolledAt = existing?.enrolledAt ?? now;

    await db.collection("skill_progress").updateOne(
      { userId: session.id, skillId, levelId },
      {
        $set: { enrolledAt, updatedAt: now },
        $setOnInsert: {
          createdAt: now,
          criteria: existing?.criteria ?? [],
          checks: existing?.checks ?? [],
          status: existing?.status ?? "not_started",
          completedAt: existing?.completedAt ?? null,
        },
      },
      { upsert: true },
    );

    const row = await db.collection("skill_progress").findOne({ userId: session.id, skillId, levelId });
    const { _id, ...rest } = row ?? {};
    return publicJson(
      { data: { ...rest, skillId, levelId, _id: _id ? String(_id) : undefined } },
      { maxAge: 0, headers: rateLimitHeaders(rl) },
    );
  } catch (e) {
    console.error("POST /api/skills/[skillId] failed", e);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
