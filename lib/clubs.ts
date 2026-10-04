/**
 * Club catalog — the public club registry (the docs under /api/clubs).
 *
 * Seeded from the app-side club constants by scripts/seed-clubs.mjs; reads go
 * through here so every route serves the same serialized shape. Clubs are
 * content, not user data: reads are unauthenticated and cached by the caller.
 */

const CLUB_COLLECTION = "clubs";

export type ClubProgram = {
  name: string;
  pillar?: "Shift" | "Sanctuary" | "Connect";
  blurb: string;
  detail: string;
  helpFields?: { key: string; label: string; placeholder?: string; multiline?: boolean }[];
  image?: string;
};

export type ClubDoc = {
  slug: string;
  name: string;
  group: string;
  ageRange: string;
  parentSlug?: string;
  tagline: string;
  description: string;
  mission?: string;
  vision?: string;
  pillarLabels?: Record<string, string>;
  color: string;
  colorDark: string;
  icon?: string;
  heroImage?: string;
  whatsappGroupLink: string;
  registrationFields: { key: string; label: string; placeholder?: string; multiline?: boolean }[];
  programs: ClubProgram[];
};

export async function ensureClubIndexes(db: any) {
  return Promise.all([
    db.collection(CLUB_COLLECTION).createIndex({ slug: 1 }, { unique: true }),
    db.collection(CLUB_COLLECTION).createIndex({ parentSlug: 1 }),
  ]);
}

/** Strip Mongo identity fields so clients only ever see the stable slug. */
export function serializeClub(doc: any): ClubDoc {
  const { _id, createdAt, updatedAt, ...rest } = doc ?? {};
  void _id;
  void createdAt;
  void updatedAt;
  return rest as ClubDoc;
}

/** Every club, age classes included, in catalog order. */
export async function listAllClubs(db: any): Promise<ClubDoc[]> {
  await ensureClubIndexes(db);
  const docs = await db.collection(CLUB_COLLECTION).find({}).toArray();
  return docs.map(serializeClub);
}

export async function getClubDoc(db: any, slug: string): Promise<ClubDoc | null> {
  await ensureClubIndexes(db);
  const doc = await db.collection(CLUB_COLLECTION).findOne({ slug });
  return doc ? serializeClub(doc) : null;
}
