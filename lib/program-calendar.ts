/**
 * Program calendar — one club's plan for a year (2027 runs March → November).
 *
 * One document per club+year in `program_calendars`; every entry is authored
 * through the admin API (nothing about the calendar is hardcoded in either
 * app). Reads are public via GET /api/clubs/[slug]/calendar, writes go through
 * /api/admin/program-calendar. Seeded from
 * scripts/program-calendar-import.json by scripts/seed-catalogs.mjs.
 */

const CALENDAR_COLLECTION = "program_calendars";

export const DEFAULT_CALENDAR_YEAR = 2027;

export type CalendarEntry = {
  id: string;
  /** ISO date the session runs on: YYYY-MM-DD. */
  date: string;
  /** Optional ISO end date for multi-day items (outing, camp). */
  endDate?: string;
  title: string;
  description?: string;
  /** Term the entry belongs to, e.g. "Term 1". */
  term?: string;
  time?: string;
  location?: string;
  /** "Indoor" | "Outdoor" | "Indoor/Outdoor" — free text kept short. */
  setting?: string;
};

export type ProgramCalendarDoc = {
  clubSlug: string;
  year: number;
  entries: CalendarEntry[];
};

export type NormalizeResult =
  | { doc: ProgramCalendarDoc }
  | { error: string };

const CLUB_SLUG = /^[a-z0-9][a-z0-9-]{1,39}$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MAX_ENTRIES = 400;
const MAX_TEXT = 400;
const MAX_TITLE = 140;

function str(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function validDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export function newEntryId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `cal-${Date.now().toString(36)}-${random}`;
}

/** Validate + normalise a raw admin payload into a storable calendar doc. */
export function normalizeCalendar(
  clubSlug: unknown,
  year: unknown,
  entries: unknown,
): NormalizeResult {
  const slug = typeof clubSlug === "string" ? clubSlug.trim().toLowerCase() : "";
  if (!CLUB_SLUG.test(slug)) return { error: "A valid club slug is required." };

  const numericYear = typeof year === "number" ? year : Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 2020 || numericYear > 2100) {
    return { error: "A year between 2020 and 2100 is required." };
  }

  if (!Array.isArray(entries)) return { error: "entries must be a list." };
  if (entries.length > MAX_ENTRIES) {
    return { error: `A year can hold at most ${MAX_ENTRIES} entries.` };
  }

  const seen = new Set<string>();
  const normalized: CalendarEntry[] = [];

  for (const raw of entries) {
    if (!raw || typeof raw !== "object") {
      return { error: "Every entry must be an object." };
    }
    const item = raw as Record<string, unknown>;

    const date = typeof item.date === "string" ? item.date.trim() : "";
    if (!validDate(date)) {
      return { error: `Entry date "${date || "?"}" must be a real YYYY-MM-DD date.` };
    }

    const endDateRaw = str(item.endDate, 32);
    if (endDateRaw && !validDate(endDateRaw)) {
      return { error: `End date "${endDateRaw}" must be a real YYYY-MM-DD date.` };
    }
    if (endDateRaw && endDateRaw < date) {
      return { error: `End date ${endDateRaw} falls before the start date ${date}.` };
    }

    const title = str(item.title, MAX_TITLE);
    if (!title) return { error: "Every entry needs a title." };

    const id =
      typeof item.id === "string" && item.id.trim()
        ? item.id.trim().slice(0, 64)
        : newEntryId();
    if (seen.has(id)) return { error: `Duplicate entry id "${id}".` };
    seen.add(id);

    normalized.push({
      id,
      date,
      ...(endDateRaw ? { endDate: endDateRaw } : {}),
      title,
      ...(str(item.description, MAX_TEXT) ? { description: str(item.description, MAX_TEXT) } : {}),
      ...(str(item.term, 40) ? { term: str(item.term, 40) } : {}),
      ...(str(item.time, 40) ? { time: str(item.time, 40) } : {}),
      ...(str(item.location, 80) ? { location: str(item.location, 80) } : {}),
      ...(str(item.setting, 40) ? { setting: str(item.setting, 40) } : {}),
    });
  }

  normalized.sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title) : a.date.localeCompare(b.date)));

  return { doc: { clubSlug: slug, year: numericYear, entries: normalized } };
}

export async function ensureCalendarIndexes(db: any) {
  return db
    .collection(CALENDAR_COLLECTION)
    .createIndex({ clubSlug: 1, year: 1 }, { unique: true });
}

/** Strip Mongo identity fields so clients only see the calendar itself. */
export function serializeCalendar(doc: any): ProgramCalendarDoc {
  const { _id, createdAt, updatedAt, clubSlug, year, entries } = doc ?? {};
  void _id;
  void createdAt;
  void updatedAt;
  return {
    clubSlug: typeof clubSlug === "string" ? clubSlug : "",
    year: typeof year === "number" ? year : Number(year),
    entries: Array.isArray(entries) ? (entries as CalendarEntry[]) : [],
  };
}

export async function getCalendar(
  db: any,
  clubSlug: string,
  year: number,
): Promise<ProgramCalendarDoc | null> {
  await ensureCalendarIndexes(db);
  const doc = await db
    .collection(CALENDAR_COLLECTION)
    .findOne({ clubSlug, year });
  return doc ? serializeCalendar(doc) : null;
}

/** Newest calendar for a club when the caller didn't name a year. */
export async function getLatestCalendar(
  db: any,
  clubSlug: string,
): Promise<ProgramCalendarDoc | null> {
  await ensureCalendarIndexes(db);
  const doc = await db
    .collection(CALENDAR_COLLECTION)
    .find({ clubSlug })
    .sort({ year: -1 })
    .limit(1)
    .toArray();
  return doc[0] ? serializeCalendar(doc[0]) : null;
}

export async function listCalendars(db: any, year?: number): Promise<ProgramCalendarDoc[]> {
  await ensureCalendarIndexes(db);
  const query = typeof year === "number" ? { year } : {};
  const docs = await db.collection(CALENDAR_COLLECTION).find(query).toArray();
  return docs
    .map(serializeCalendar)
    .sort(
      (a: ProgramCalendarDoc, b: ProgramCalendarDoc) =>
        a.clubSlug.localeCompare(b.clubSlug) || a.year - b.year,
    );
}

export async function saveCalendar(db: any, doc: ProgramCalendarDoc): Promise<ProgramCalendarDoc> {
  await ensureCalendarIndexes(db);
  const now = new Date();
  await db.collection(CALENDAR_COLLECTION).updateOne(
    { clubSlug: doc.clubSlug, year: doc.year },
    {
      $set: { entries: doc.entries, updatedAt: now },
      $setOnInsert: { clubSlug: doc.clubSlug, year: doc.year, createdAt: now },
    },
    { upsert: true },
  );
  return doc;
}

export async function deleteCalendar(db: any, clubSlug: string, year: number): Promise<boolean> {
  await ensureCalendarIndexes(db);
  const res = await db.collection(CALENDAR_COLLECTION).deleteOne({ clubSlug, year });
  return (res?.deletedCount ?? 0) > 0;
}
