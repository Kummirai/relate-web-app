import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
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
import { ensureSkillIndexes } from "@/lib/skills";

const MAX_MODULE_ID = 120;
const MAX_DELIVERABLE_URL = 2048;

async function readSkillId(params: Promise<{ skillId: string }>) {
  const { skillId } = await params;
  const id = String(skillId || "").trim().toLowerCase();
  if (!id || id.length < 2) return null;
  return id;
}

function readFlag(value: unknown): boolean | null {
  if (value === undefined) return null;
  if (typeof value !== "boolean") return null;
  return value;
}

/** GET /api/skills/<skillId>/modules — every module row this member saved for the skill. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> },
) {
  try {
    const rl = rateLimit(`skill-modules-get:${clientIp(request)}`, 60, 60_000);
    if (!rl.ok) return publicTooMany();

    const skillId = await readSkillId(params);
    if (!skillId) return publicNotFound("Unknown skill.");

    const db = await getDb();
    await ensureIndexes(db);
    await ensureSkillIndexes(db);

    const session = await resolveSession(request);
    if (!session) return publicJson({ data: [] }, { maxAge: 0 });

    const rows = await db
      .collection("module_progress")
      .find({ userId: session.id, skillId })
      .toArray();

    const data = rows.map((row: any) => {
      const { _id, ...rest } = row;
      void _id;
      return rest;
    });

    return publicJson({ data }, { maxAge: 0, headers: rateLimitHeaders(rl) });
  } catch (e) {
    console.error("GET /api/skills/[skillId]/modules failed", e);
    return publicError();
  }
}

/**
 * POST /api/skills/<skillId>/modules — upsert one module's progress.
 * Body: { moduleId, completed?, deliverableSubmitted?, deliverableUrl? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> },
) {
  try {
    const rl = rateLimit(`skill-modules-post:${clientIp(request)}`, 30, 60_000);
    if (!rl.ok) return publicTooMany();

    const skillId = await readSkillId(params);
    if (!skillId) return publicNotFound("Unknown skill.");

    const session = await resolveSession(request);
    if (!session) {
      return publicJson(
        { error: "Sign in to save module progress." },
        { status: 401, maxAge: 0 },
      );
    }

    const body = (await request.json().catch(() => ({}))) ?? {};
    const moduleId = String(body.moduleId || "").trim();
    if (!moduleId || moduleId.length > MAX_MODULE_ID)
      return publicBadRequest("moduleId is required.");

    const completed = readFlag(body.completed);
    const deliverableSubmitted = readFlag(body.deliverableSubmitted);
    let deliverableUrl: string | null = null;
    if (body.deliverableUrl !== undefined && body.deliverableUrl !== null) {
      if (
        typeof body.deliverableUrl !== "string" ||
        body.deliverableUrl.length > MAX_DELIVERABLE_URL ||
        !/^https?:\/\//.test(body.deliverableUrl)
      ) {
        return publicBadRequest("deliverableUrl must be an http(s) URL.");
      }
      deliverableUrl = body.deliverableUrl;
    }

    if (
      completed === null &&
      deliverableSubmitted === null &&
      deliverableUrl === null
    ) {
      return publicBadRequest("Nothing to save.");
    }

    const db = await getDb();
    await ensureIndexes(db);
    await ensureSkillIndexes(db);

    const existing = await db
      .collection("module_progress")
      .findOne({ userId: session.id, skillId, moduleId });

    const now = new Date();
    const nextCompleted = completed ?? existing?.completed ?? false;
    const nextSubmitted = deliverableSubmitted ?? existing?.deliverableSubmitted ?? deliverableUrl !== null;
    const nextUrl = deliverableUrl !== null ? deliverableUrl : (existing?.deliverableUrl ?? null);

    const completedAt = nextCompleted
      ? existing?.completedAt instanceof Date
        ? existing.completedAt
        : now
      : null;

    const doc = {
      id: existing?.id ?? randomUUID(),
      userId: session.id,
      skillId,
      moduleId,
      completed: nextCompleted,
      completedAt,
      deliverableSubmitted: nextSubmitted,
      deliverableUrl: nextUrl,
      updatedAt: now,
      ...(existing?._id ? {} : { createdAt: now }),
    };

    await db.collection("module_progress").updateOne(
      { userId: session.id, skillId, moduleId },
      {
        $set: {
          completed: nextCompleted,
          completedAt,
          deliverableSubmitted: nextSubmitted,
          deliverableUrl: nextUrl,
          updatedAt: now,
        },
        $setOnInsert: { id: doc.id, createdAt: now },
      },
      { upsert: true },
    );

    return publicJson(
      { data: doc },
      { maxAge: 0, headers: rateLimitHeaders(rl) },
    );
  } catch (e) {
    console.error("POST /api/skills/[skillId]/modules failed", e);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
