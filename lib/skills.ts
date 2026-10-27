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

export type SkillProject = {
  title: string;
  tier: string;
  fee?: string;
};

/** Curriculum domains the modules belong to (Pulse tracks; Prime's single track). */
export type SkillTrackCategory =
  | "smart_saver"
  | "career_launch"
  | "digital_productivity"
  | "wellness_fitness";

/** One curriculum module inside a skill — progress lives in `module_progress`. */
export type SkillModule = {
  id: string;
  trackCategory: SkillTrackCategory;
  title: string;
  description: string;
  order: number;
  durationMinutes: number;
  deliverableDescription: string;
};

/** Static widget content for the skill detail page (member state is derived at runtime). */
export type SkillDetail = {
  /** Tools the member uses — shown as chips in the overview. */
  tools?: string[];
  /** Curriculum provider shown in the learning tracker (e.g. "The Odin Project"). */
  learningProvider?: string;
  /** External course URL the member learns from (e.g. the free Cisco NetAcad programme). */
  learningUrl?: string;
  /** In-app features that support this skill — chips in the overview card. */
  appFeatures?: string[];
  /** Entry routes for the skill — rendered as the "Your pathway" card. */
  pathways?: {
    sproutGraduate?: string;
    directEntrant?: string;
  };
  /** Paid Relate Projects — order matches the "Relate Projects" level requirements. */
  projects?: SkillProject[];
  /** Display copy for the project board's unlock rule. */
  unlockRule?: string;
  /** Requirement text (Learning level) that must complete before Tier 2+ projects unlock. */
  unlockAfter?: string;
  /** Launch Fund goal shown in the savings widget. */
  launchFund?: {
    goalName?: string;
    targetAmount?: number;
    autoRouting?: string;
    disbursementRule?: string;
  };
};

export type Skill = {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Royalty-free photo for the skill card (absolute URL on relateworld.org). */
  image?: string;
  /** Compulsory skills every club member takes; the rest are electives. */
  type?: "Compulsory" | "Elective";
  /** Ultimate deliverable of the skill — rendered as the output callout. */
  output?: string;
  /** Widget content for the skill detail page. */
  detail?: SkillDetail;
  /** Curriculum modules (Pulse tracks / Prime Smart Saver) — module progress is separate. */
  modules?: SkillModule[];
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

/** Per-member progress for one curriculum module (`module_progress` collection). */
export type ModuleProgress = {
  /** UUID assigned on first save. */
  id: string;
  userId: string;
  skillId: string;
  moduleId: string;
  completed: boolean;
  completedAt: Date | null;
  deliverableSubmitted: boolean;
  deliverableUrl: string | null;
  updatedAt: Date;
  createdAt: Date;
};

export async function ensureSkillIndexes(db: any) {
  return Promise.all([
    db.collection(SKILLS_COLLECTION).createIndex({ id: 1 }, { unique: true }),
    db.collection("skill_progress").createIndex({ userId: 1, skillId: 1, levelId: 1 }, { unique: true }),
    db.collection("skill_progress").createIndex({ userId: 1, status: 1, updatedAt: -1 }),
    db.collection("module_progress").createIndex({ userId: 1, moduleId: 1 }, { unique: true }),
    db.collection("module_progress").createIndex({ userId: 1, skillId: 1 }),
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
