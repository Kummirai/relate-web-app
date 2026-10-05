/**
 * Skills framework — club-specific skills with levels and requirements.
 *
 * One document in `skills` (id "framework"): the full skill catalog is a
 * single coherent framework, so it is served whole. Progress (who earned what)
 * stays in the `skill_progress` collection.
 * Seeded from scripts/skills-import.json by scripts/seed-catalogs.mjs.
 */

const SKILLS_COLLECTION = "skills";
const SKILLS_DOC_ID = "framework";

export type SkillRequirement = {
  text: string;
  criteria: string[];
};

export type SkillLevel = {
  id: string;
  name: string;
  /** Optional blurb shown above a level's skills (age band + focus for Sprout). */
  description?: string;
  levelNumber: number;
  color: string;
  colorDark: string;
  requirements: SkillRequirement[];
};

export type Skill = {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Royalty-free photo for the skill card (absolute URL on relateworld.org). */
  image?: string;
  levels: SkillLevel[];
};

/** One club inside the framework document — skills grouped per club. */
export type SkillsClub = {
  slug: string;
  name: string;
  ageRange?: string;
  skills: Skill[];
};

export type SkillProgress = {
  userId: string;
  skillId: string;
  levelId: string;
  clubSlug: string;
  criteria: boolean[][];
  checks: boolean[];
  status: "not_started" | "in_progress" | "complete";
  enrolledAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
};

export async function ensureSkillIndexes(db: any) {
  return Promise.all([
    db.collection(SKILLS_COLLECTION).createIndex({ id: 1 }, { unique: true }),
    db.collection("skill_progress").createIndex({ userId: 1, skillId: 1, levelId: 1 }, { unique: true }),
    db.collection("skill_progress").createIndex({ userId: 1, status: 1, updatedAt: -1 }),
  ]);
}

function statusOf(checks: boolean[]): "not_started" | "in_progress" | "complete" {
  if (checks.every(Boolean)) return "complete";
  return checks.some(Boolean) ? "in_progress" : "not_started";
}

function checksFrom(criteria: boolean[][]): boolean[] {
  return criteria.map((row) => row.length > 0 && row.every(Boolean));
}

export async function getSkillsFramework(db: any) {
  await ensureSkillIndexes(db);
  const doc = await db.collection(SKILLS_COLLECTION).findOne({ id: SKILLS_DOC_ID });
  if (!doc) return null;
  const { _id, id, createdAt, updatedAt, ...rest } = doc;
  void _id;
  void id;
  void createdAt;
  void updatedAt;
  return rest as { clubs: SkillsClub[] };
}

export async function getSkillProgress(db: any, userId: string, skillId: string, levelId: string) {
  await ensureSkillIndexes(db);
  const doc = await db.collection("skill_progress").findOne({ userId, skillId, levelId });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  void _id;
  return rest as Omit<SkillProgress, "_id">;
}

export async function upsertSkillProgress(db: any, progress: Partial<SkillProgress> & { userId: string; skillId: string; levelId: string }) {
  await ensureSkillIndexes(db);
  const now = new Date();
  const existing = await db.collection("skill_progress").findOne({ userId: progress.userId, skillId: progress.skillId, levelId: progress.levelId });

  const criteria = progress.criteria ?? existing?.criteria ?? [];
  const checks = progress.checks ?? checksFrom(criteria);
  const status = progress.status ?? statusOf(checks);
  const clubSlug = progress.clubSlug ?? existing?.clubSlug ?? "";

  const completedAt = progress.completedAt ?? (status === "complete" ? (existing?.completedAt instanceof Date ? existing.completedAt : now) : (existing?.completedAt ?? null));
  const enrolledAt = existing?.enrolledAt ?? now;

  const doc: any = {
    userId: progress.userId,
    skillId: progress.skillId,
    levelId: progress.levelId,
    clubSlug,
    criteria,
    checks,
    status,
    enrolledAt,
    completedAt,
    updatedAt: now,
  };

  await db.collection("skill_progress").updateOne(
    { userId: progress.userId, skillId: progress.skillId, levelId: progress.levelId },
    {
      $set: {
        criteria,
        checks,
        status,
        completedAt,
        enrolledAt,
        updatedAt: now,
        ...(progress.clubSlug ? { clubSlug: progress.clubSlug } : {}),
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  return doc;
}
