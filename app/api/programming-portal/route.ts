import { NextRequest } from "next/server";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";
import {
  publicBadRequest,
  publicError,
  publicJson,
  publicTooMany,
} from "@/lib/public-api/render";
import { resolveSession, ensureIndexes } from "@/lib/community-auth";
import { getDb } from "@/lib/mongodb";

/**
 * Sprout Tweens Programming Portal — evolving-profile progress.
 *
 * One document per account in `programming_portal_progress` holds the
 * student's checked milestones, quiz best scores, derived XP, daily streak
 * and Master Web Builder badge state. The web learning portal writes here;
 * the Expo companion reads the same document for its progress cards.
 *
 * XP is always recomputed server-side from milestones + quiz best scores
 * (+ badge bonus) so the client can never inflate a total.
 */

const PORTAL_SKILL_ID = "sprout_03_programming";
const MILESTONE_XP = 50;
const QUIZ_XP_PER_POINT = 25;
const MASTER_BADGE_XP = 200;
const QUIZ_TOTAL = 3;
const MAX_ID = 64;

type QuizRecord = {
  score: number;
  total: number;
  attempts: number;
  completedAt: Date;
};

type PortalDoc = {
  userId: string;
  milestones: Record<string, true>;
  quizzes: Record<string, QuizRecord>;
  masterBadgeAwarded: boolean;
  masterBadgeAwardedAt: Date | null;
  xp: number;
  streakCurrent: number;
  streakLongest: number;
  streakLastActiveDate: string | null;
  createdAt?: Date;
  updatedAt: Date;
};

let portalIndexesEnsured = false;

async function ensurePortalIndexes(db: any) {
  if (portalIndexesEnsured) return;
  portalIndexesEnsured = true;
  try {
    await db
      .collection("programming_portal_progress")
      .createIndex({ userId: 1 }, { unique: true });
    await db
      .collection("programming_portal_progress")
      .createIndex({ updatedAt: -1 });
  } catch (e) {
    portalIndexesEnsured = false;
    console.error("ensurePortalIndexes failed", e);
  }
}

function emptyDoc(userId: string): PortalDoc {
  return {
    userId,
    milestones: {},
    quizzes: {},
    masterBadgeAwarded: false,
    masterBadgeAwardedAt: null,
    xp: 0,
    streakCurrent: 0,
    streakLongest: 0,
    streakLastActiveDate: null,
    updatedAt: new Date(),
  };
}

function milestoneKey(year: number, id: string) {
  return `${year}:${id}`;
}

function quizPassCount(quizzes: Record<string, QuizRecord>) {
  return Object.values(quizzes).filter((q) => q.score >= 2).length;
}

function computeXp(doc: PortalDoc) {
  const milestoneCount = Object.keys(doc.milestones).length;
  let quizPoints = 0;
  for (const record of Object.values(doc.quizzes)) {
    quizPoints += Math.min(record.score, record.total) * QUIZ_XP_PER_POINT;
  }
  const badgeXp = doc.masterBadgeAwarded ? MASTER_BADGE_XP : 0;
  return milestoneCount * MILESTONE_XP + quizPoints + badgeXp;
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function utcYesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Bump the daily streak for any portal activity. Returns changed fields. */
function applyStreak(doc: PortalDoc, today = utcToday()) {
  if (doc.streakLastActiveDate === today) return {};
  let current = 1;
  if (doc.streakLastActiveDate === utcYesterday()) {
    current = (doc.streakCurrent || 0) + 1;
  }
  return {
    streakCurrent: current,
    streakLongest: Math.max(doc.streakLongest || 0, current),
    streakLastActiveDate: today,
  };
}

function publicProgress(doc: PortalDoc) {
  const quizzes: Record<
    string,
    { score: number; total: number; attempts: number; passed: boolean }
  > = {};
  for (const [id, record] of Object.entries(doc.quizzes)) {
    quizzes[id] = {
      score: record.score,
      total: record.total,
      attempts: record.attempts,
      passed: record.score >= 2,
    };
  }
  return {
    skillId: PORTAL_SKILL_ID,
    xp: doc.xp,
    milestones: Object.keys(doc.milestones),
    quizzes,
    masterBadgeAwarded: !!doc.masterBadgeAwarded,
    streak: {
      current: doc.streakCurrent || 0,
      longest: doc.streakLongest || 0,
      lastActiveDate: doc.streakLastActiveDate ?? null,
    },
  };
}

async function loadDoc(db: any, userId: string): Promise<PortalDoc> {
  const found = await db
    .collection("programming_portal_progress")
    .findOne({ userId });
  if (!found) return emptyDoc(userId);
  return {
    userId,
    milestones: found.milestones ?? {},
    quizzes: found.quizzes ?? {},
    masterBadgeAwarded: !!found.masterBadgeAwarded,
    masterBadgeAwardedAt: found.masterBadgeAwardedAt ?? null,
    xp: found.xp ?? 0,
    streakCurrent: found.streakCurrent ?? 0,
    streakLongest: found.streakLongest ?? 0,
    streakLastActiveDate: found.streakLastActiveDate ?? null,
    updatedAt: found.updatedAt ?? new Date(),
  };
}

async function saveDoc(db: any, doc: PortalDoc) {
  const now = new Date();
  await db.collection("programming_portal_progress").updateOne(
    { userId: doc.userId },
    {
      $set: {
        milestones: doc.milestones,
        quizzes: doc.quizzes,
        masterBadgeAwarded: doc.masterBadgeAwarded,
        masterBadgeAwardedAt: doc.masterBadgeAwardedAt,
        xp: doc.xp,
        streakCurrent: doc.streakCurrent,
        streakLongest: doc.streakLongest,
        streakLastActiveDate: doc.streakLastActiveDate,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
}

function readId(value: unknown): string | null {
  const id = String(value ?? "").trim();
  if (!id || id.length > MAX_ID) return null;
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) return null;
  return id;
}

/** GET /api/programming-portal — the signed-in student's portal progress. */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`programming-portal-get:${clientIp(request)}`, 60, 60_000);
    if (!rl.ok) return publicTooMany();

    const db = await getDb();
    await ensureIndexes(db);
    await ensurePortalIndexes(db);

    const session = await resolveSession(request);
    if (!session) {
      return publicJson(
        { data: null, error: "Sign in to load your portal progress." },
        { status: 401, maxAge: 0 },
      );
    }

    const doc = await loadDoc(db, session.id);
    return publicJson(
      { data: publicProgress(doc) },
      { maxAge: 0, headers: rateLimitHeaders(rl) },
    );
  } catch (e) {
    console.error("GET /api/programming-portal failed", e);
    return publicError();
  }
}

/**
 * POST /api/programming-portal — mutate portal progress.
 * Body (one action per call):
 *   { milestone: { year: 1-4, id: string, completed: boolean } }
 *   { quiz: { year: 1-4, id: string, score: number } }   // total is always 3
 *   { claimMasterBadge: true }
 */
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(`programming-portal-post:${clientIp(request)}`, 40, 60_000);
    if (!rl.ok) return publicTooMany();

    const db = await getDb();
    await ensureIndexes(db);
    await ensurePortalIndexes(db);

    const session = await resolveSession(request);
    if (!session) {
      return publicJson(
        { error: "Sign in to save portal progress." },
        { status: 401, maxAge: 0 },
      );
    }

    const body = (await request.json().catch(() => ({}))) ?? {};
    const doc = await loadDoc(db, session.id);
    const beforeXp = doc.xp;
    let mutated = false;

    if (body.milestone) {
      const { year, id, completed } = body.milestone ?? {};
      const yearNum = Number(year);
      const milestoneId = readId(id);
      if (![1, 2, 3, 4].includes(yearNum))
        return publicBadRequest("milestone.year must be 1, 2, 3 or 4.");
      if (!milestoneId)
        return publicBadRequest("milestone.id is required.");
      if (typeof completed !== "boolean")
        return publicBadRequest("milestone.completed must be a boolean.");

      const key = milestoneKey(yearNum, milestoneId);
      if (completed) {
        if (!doc.milestones[key]) {
          doc.milestones[key] = true;
          mutated = true;
        }
      } else if (doc.milestones[key]) {
        delete doc.milestones[key];
        mutated = true;
      }
    } else if (body.quiz) {
      const { year, id, score } = body.quiz ?? {};
      const yearNum = Number(year);
      const quizId = readId(id);
      const scoreNum = Number(score);
      if (![1, 2, 3, 4].includes(yearNum))
        return publicBadRequest("quiz.year must be 1, 2, 3 or 4.");
      if (!quizId) return publicBadRequest("quiz.id is required.");
      if (
        !Number.isInteger(scoreNum) ||
        scoreNum < 0 ||
        scoreNum > QUIZ_TOTAL
      ) {
        return publicBadRequest(`quiz.score must be an integer 0–${QUIZ_TOTAL}.`);
      }

      const existing = doc.quizzes[quizId];
      // Best score wins; attempts always count. No XP farming on retakes.
      if (!existing || scoreNum > existing.score || !existing.completedAt) {
        doc.quizzes[quizId] = {
          score: Math.max(scoreNum, existing?.score ?? 0),
          total: QUIZ_TOTAL,
          attempts: (existing?.attempts ?? 0) + 1,
          completedAt: existing?.completedAt ?? new Date(),
        };
        mutated = true;
      } else {
        doc.quizzes[quizId] = {
          ...existing,
          attempts: existing.attempts + 1,
        };
        mutated = true;
      }
    } else if (body.claimMasterBadge === true) {
      const milestoneCount = Object.keys(doc.milestones).length;
      const passedQuizzes = quizPassCount(doc.quizzes);
      if (milestoneCount < 16 || passedQuizzes < 4) {
        return publicBadRequest(
          "Complete every milestone and pass every year quiz before claiming the Master Web Builder Badge.",
        );
      }
      if (!doc.masterBadgeAwarded) {
        doc.masterBadgeAwarded = true;
        doc.masterBadgeAwardedAt = new Date();
        mutated = true;
      }
    } else {
      return publicBadRequest(
        "Send milestone, quiz or claimMasterBadge in the request body.",
      );
    }

    if (!mutated) {
      return publicJson(
        { data: { ...publicProgress(doc), gainedXp: 0 } },
        { maxAge: 0, headers: rateLimitHeaders(rl) },
      );
    }

    Object.assign(doc, applyStreak(doc));
    doc.xp = computeXp(doc);
    await saveDoc(db, doc);

    return publicJson(
      {
        data: {
          ...publicProgress(doc),
          gainedXp: Math.max(0, doc.xp - beforeXp),
        },
      },
      { maxAge: 0, headers: rateLimitHeaders(rl) },
    );
  } catch (e) {
    console.error("POST /api/programming-portal failed", e);
    return publicError();
  }
}
