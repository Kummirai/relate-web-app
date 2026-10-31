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
 * POST /api/programming-portal — disabled for students.
 *
 * Blueprint §4: progression is admin-verified. Milestones are approved by an
 * instructor via POST /api/admin/programming-portal, so the student route no
 * longer accepts milestone, quiz or badge writes.
 */
export async function POST(request: NextRequest) {
  const rl = rateLimit(`programming-portal-post:${clientIp(request)}`, 40, 60_000);
  if (!rl.ok) return publicTooMany();

  return publicJson(
    {
      error:
        "Your instructor approves milestones — progress updates automatically once they sign off.",
    },
    { status: 403, maxAge: 0, headers: rateLimitHeaders(rl) },
  );
}
