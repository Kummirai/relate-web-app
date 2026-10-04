/**
 * Sprout honors framework — tracks, levels and badge requirements.
 *
 * One document in `sprout_honors` (id "framework"): the badge matrix is a
 * single coherent framework, so it is served whole. Progress (who earned what)
 * stays in the existing honor_progress collection — this is just the content.
 * Seeded from the web app's honors constants by scripts/seed-sprout-honors.mjs.
 */

const HONORS_COLLECTION = "sprout_honors";
const HONORS_DOC_ID = "framework";

export type HonorsFramework = {
  tracks?: unknown[];
  levels?: unknown[];
  shapeLabels?: Record<string, string>;
  honorCount?: number;
};

export async function ensureHonorsIndexes(db: any) {
  return db.collection(HONORS_COLLECTION).createIndex({ id: 1 }, { unique: true });
}

export async function getHonorsFramework(db: any): Promise<HonorsFramework | null> {
  await ensureHonorsIndexes(db);
  const doc = await db.collection(HONORS_COLLECTION).findOne({ id: HONORS_DOC_ID });
  if (!doc) return null;
  const { _id, id, createdAt, updatedAt, ...rest } = doc;
  void _id;
  void id;
  void createdAt;
  void updatedAt;
  return rest as HonorsFramework;
}
