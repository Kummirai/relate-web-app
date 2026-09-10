import { getDb } from "./mongodb";

export type PubCursor = {
  _id?: unknown;
  id: string;
  kind: string;
  series?: string;
  clubSlug?: string;
  title?: string;
  issue?: string;
  month?: string;
  year?: number;
  cover?: string;
  summary?: string;
  tags?: string[];
  theme?: string;
  coverLines?: string[];
  season?: { label?: string; start?: string; end?: string; name?: string; year?: number };
  status?: string;
  blocks?: any[];
  weeks?: any[];
  publishedAt?: Date | null;
  updatedAt?: Date;
};

/** Public reads: drafts are never returned. */
export async function getPublication(id: string): Promise<PubCursor | null> {
  if (!id) return null;
  const db = await getDb();
  const doc = await db.collection("publications").findOne({ id, status: "published" });
  return (doc as PubCursor | null) || null;
}

export async function listPublications(opts: {
  club?: string;
  limit?: number;
} = {}): Promise<PubCursor[]> {
  const query: Record<string, unknown> = { status: "published" };
  const club = opts.club?.trim();
  if (club) {
    if (club === "relate") query.clubSlug = { $exists: false };
    else query.clubSlug = club;
  }
  const db = await getDb();
  return (await db
    .collection("publications")
    .find(query)
    .sort({ year: -1, publishedAt: -1 })
    .limit(opts.limit && opts.limit > 0 ? opts.limit : 100)
    .project({ weeks: 0, blocks: 0, intro: 0 })
    .toArray()) as PubCursor[];
}

export async function featuredPublications(limit = 3): Promise<PubCursor[]> {
  return listPublications({ limit });
}