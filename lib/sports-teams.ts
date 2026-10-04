/**
 * Sports catalog — teams, squads, position slots and fixtures.
 *
 * One document in `sports_config` (id "default") because the pieces are one
 * coherent config: a team without its squad/slot rules is not useful. Seeded
 * from the web app's squad constants by scripts/seed-sports.mjs.
 */

const SPORTS_COLLECTION = "sports_config";
const SPORTS_DOC_ID = "default";

export type SportsConfig = {
  director?: { name: string; role: string };
  sports?: string[];
  teams?: unknown[];
  positionSlots?: Record<string, unknown>;
  squadSize?: Record<string, number>;
  maxPerPosition?: number;
  squads?: Record<string, unknown>;
};

export async function ensureSportsIndexes(db: any) {
  return db.collection(SPORTS_COLLECTION).createIndex({ id: 1 }, { unique: true });
}

export async function getSportsConfig(db: any): Promise<SportsConfig | null> {
  await ensureSportsIndexes(db);
  const doc = await db.collection(SPORTS_COLLECTION).findOne({ id: SPORTS_DOC_ID });
  if (!doc) return null;
  const { _id, id, createdAt, updatedAt, ...rest } = doc;
  void _id;
  void id;
  void createdAt;
  void updatedAt;
  return rest as SportsConfig;
}
