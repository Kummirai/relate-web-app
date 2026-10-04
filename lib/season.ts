/**
 * Season / study-guide calendar + publication document builder.
 *
 * This mirrors the mobile pipeline (mobile_app/scripts/generate-season.mjs):
 * a seasonal study guide is always built from a canonical 7-day-per-week
 * calendar derived from the season's start/end dates, so the web reads the
 * exact same shape the Expo app renders.
 */

import { clubName } from "./catalog";

export type InteractiveBlockTypes = "checklist" | "quiz" | "reflection" | "pray";

/** An image or quote placed inline within a reading structure slot. */
export type ReadingMedia =
  | { type: "image"; uri: string; caption?: string }
  | { type: "quote"; text: string; by?: string; source?: string };

export type ReadingStructure = {
  intro: {
    hook: string;
    thesis: string;
    beforeHook?: ReadingMedia[];
    afterHook?: ReadingMedia[];
    afterThesis?: ReadingMedia[];
  };
  body: {
    topic: string;
    support: string[];
    closing?: string;
    beforeTopic?: ReadingMedia[];
    afterTopic?: ReadingMedia[];
    afterSupport?: ReadingMedia[];
    afterClosing?: ReadingMedia[];
  }[];
  conclusion: {
    restate: string;
    whyItMatters: string;
    closing: string;
    beforeRestate?: ReadingMedia[];
    afterRestate?: ReadingMedia[];
    afterWhyItMatters?: ReadingMedia[];
    afterClosing?: ReadingMedia[];
  };
};

export type PubBlock = {
  type:
    | "paragraph"
    | "heading"
    | "quote"
    | "image"
    | "list"
    | "reading"
    | InteractiveBlockTypes;
  id?: string;
  text?: string;
  by?: string;
  source?: string;
  uri?: string;
  caption?: string;
  items?: string[];
  title?: string;
  question?: string;
  options?: string[];
  correctIndex?: number;
  explain?: string;
  prompt?: string;
  placeholder?: string;
  structure?: ReadingStructure;
};

export type PubDay = {
  date: string;
  day: number;
  weekday: string;
  title: string;
  verse?: { text: string; by?: string };
  blocks: PubBlock[];
};

export type PubWeek = {
  index: number;
  title: string;
  theme?: string;
  intro: PubBlock[];
  days: PubDay[];
};

export type PublicationDoc = {
  id: string;
  kind: "magazine" | "bulletin";
  series?: string;
  clubSlug?: string;
  title: string;
  issue: string;
  month: string;
  year: number;
  cover: string;
  summary: string;
  tags: string[];
  blocks: PubBlock[];
  season?: {
    name: string;
    year: number;
    label: string;
    start: string;
    end: string;
  };
  theme?: string;
  coverLines?: string[];
  weeks?: PubWeek[];
  status: "published" | "draft";
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISO(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthNameOf(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return "January";
  return MONTH_NAMES[m - 1] || "January";
}

function validISO(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !isNaN(parseISO(iso).getTime());
}

/** One entry per calendar day of the season. */
export function buildSeasonDays(
  startISO: string,
  endISO: string,
): { date: string; day: number; weekday: string }[] {
  if (!validISO(startISO) || !validISO(endISO)) return [];
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  if (start > end) return [];
  const days: { date: string; day: number; weekday: string }[] = [];
  let dayNumber = 1;
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push({ date: toISO(d), day: dayNumber, weekday: WEEKDAYS[d.getUTCDay()] });
    dayNumber += 1;
  }
  return days;
}

/** 7-day weeks from the season range. */
export function buildWeeks(
  startISO: string,
  endISO: string,
): { index: number; days: { date: string; day: number; weekday: string }[] }[] {
  const days = buildSeasonDays(startISO, endISO);
  const weeks: { index: number; days: { date: string; day: number; weekday: string }[] }[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push({ index: weeks.length + 1, days: days.slice(i, i + 7) });
  }
  return weeks;
}

const INTERACTIVE_TYPES = new Set(["checklist", "quiz", "reflection", "pray"]);

/** Ensure interactive blocks carry stable `<kind>-<week>-<dayOfWeek>` ids. */
function withDayId(block: PubBlock, weekIdx: number, dayOfWeek: number): PubBlock {
  if (!block || !INTERACTIVE_TYPES.has(block.type) || block.id) return block;
  const kind = block.type === "pray" ? "pray" : "reflect";
  return { ...block, id: `${kind}-${weekIdx}-${dayOfWeek}` };
}

const ALLOWED_BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "quote",
  "image",
  "list",
  "reading",
  "checklist",
  "quiz",
  "reflection",
  "pray",
]);

export function emptyReading(): ReadingStructure {
  return {
    intro: {
      hook: "",
      thesis: "",
      beforeHook: [],
      afterHook: [],
      afterThesis: [],
    },
    body: [{ topic: "", support: [], closing: "", beforeTopic: [], afterTopic: [], afterSupport: [], afterClosing: [] }],
    conclusion: {
      restate: "",
      whyItMatters: "",
      closing: "",
      beforeRestate: [],
      afterRestate: [],
      afterWhyItMatters: [],
      afterClosing: [],
    },
  };
}

/** True when the reading carries any text or inline media worth persisting. */
export function readingHasContent(r?: ReadingStructure | null): boolean {
  if (!r) return false;
  const has = (m?: ReadingMedia[]) => (m?.length ?? 0) > 0;
  const intro = r.intro ?? emptyReading().intro;
  const conclusion = r.conclusion ?? emptyReading().conclusion;
  const body = Array.isArray(r.body) ? r.body : [];
  return !!(
    intro.hook ||
    intro.thesis ||
    has(intro.beforeHook) ||
    has(intro.afterHook) ||
    has(intro.afterThesis) ||
    body.some(
      (b) =>
        b.topic ||
        (b.support?.length ?? 0) > 0 ||
        b.closing ||
        has(b.beforeTopic) ||
        has(b.afterTopic) ||
        has(b.afterSupport) ||
        has(b.afterClosing),
    ) ||
    conclusion.restate ||
    conclusion.whyItMatters ||
    conclusion.closing ||
    has(conclusion.beforeRestate) ||
    has(conclusion.afterRestate) ||
    has(conclusion.afterWhyItMatters) ||
    has(conclusion.afterClosing)
  );
}

function sanitizeReadingMedia(raw: unknown): ReadingMedia | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  if (m.type === "image") {
    const uri = str(m.uri);
    if (!uri) return null;
    const media: ReadingMedia = { type: "image", uri };
    const caption = str(m.caption);
    if (caption) media.caption = caption;
    return media;
  }
  if (m.type === "quote") {
    const text = str(m.text);
    if (!text) return null;
    const media: ReadingMedia = { type: "quote", text };
    const by = str(m.by);
    if (by) media.by = by;
    const source = str(m.source);
    if (source) media.source = source;
    return media;
  }
  return null;
}

function sanitizeMediaList(raw: unknown): ReadingMedia[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeReadingMedia).filter((m): m is ReadingMedia => m !== null);
}

function sanitizeReadingStructure(raw: unknown): ReadingStructure | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const intro = r.intro as Record<string, unknown> | undefined;
  const conclusion = r.conclusion as Record<string, unknown> | undefined;
  const bodyRaw = Array.isArray(r.body) ? r.body : [];
  const body = bodyRaw
    .filter((b): b is Record<string, unknown> => !!b && typeof b === "object")
    .map((b) => ({
      topic: str(b.topic),
      support: Array.isArray(b.support)
        ? b.support.filter((s): s is string => typeof s === "string").map((s) => s.trim()).filter(Boolean)
        : [],
      closing: str(b.closing),
      beforeTopic: sanitizeMediaList(b.beforeTopic),
      afterTopic: sanitizeMediaList(b.afterTopic),
      afterSupport: sanitizeMediaList(b.afterSupport),
      afterClosing: sanitizeMediaList(b.afterClosing),
    }))
    .filter(
      (b) =>
        b.topic ||
        b.support.length ||
        b.closing ||
        b.beforeTopic.length ||
        b.afterTopic.length ||
        b.afterSupport.length ||
        b.afterClosing.length,
    );
  return {
    intro: {
      hook: str(intro?.hook),
      thesis: str(intro?.thesis),
      beforeHook: sanitizeMediaList(intro?.beforeHook),
      afterHook: sanitizeMediaList(intro?.afterHook),
      afterThesis: sanitizeMediaList(intro?.afterThesis),
    },
    body,
    conclusion: {
      restate: str(conclusion?.restate),
      whyItMatters: str(conclusion?.whyItMatters),
      closing: str(conclusion?.closing),
      beforeRestate: sanitizeMediaList(conclusion?.beforeRestate),
      afterRestate: sanitizeMediaList(conclusion?.afterRestate),
      afterWhyItMatters: sanitizeMediaList(conclusion?.afterWhyItMatters),
      afterClosing: sanitizeMediaList(conclusion?.afterClosing),
    },
  };
}

/** Drops unknown fields/types so a bad editor payload can't corrupt the doc. */
export function sanitizeBlock(raw: unknown): PubBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.type !== "string" || !ALLOWED_BLOCK_TYPES.has(b.type)) return null;
  const block: PubBlock = { type: b.type as PubBlock["type"] };
  if (typeof b.id === "string") block.id = b.id;
  if (typeof b.text === "string") block.text = b.text;
  if (typeof b.by === "string") block.by = b.by;
  if (typeof b.source === "string") block.source = b.source;
  if (typeof b.uri === "string") block.uri = b.uri;
  if (typeof b.caption === "string") block.caption = b.caption;
  if (typeof b.title === "string") block.title = b.title;
  if (typeof b.question === "string") block.question = b.question;
  if (typeof b.prompt === "string") block.prompt = b.prompt;
  if (typeof b.placeholder === "string") block.placeholder = b.placeholder;
  if (typeof b.explain === "string") block.explain = b.explain;
  if (b.type === "reading") {
    const structure = sanitizeReadingStructure(b.structure);
    if (structure) block.structure = structure;
  }
  if (Array.isArray(b.items)) {
    block.items = b.items.filter((i): i is string => typeof i === "string");
  }
  if (Array.isArray(b.options)) {
    block.options = b.options.filter((o): o is string => typeof o === "string");
  }
  const ci = Number(b.correctIndex);
  if (Number.isInteger(ci) && ci >= 0) block.correctIndex = ci;
  return block;
}

function sanitizeBlocks(raw: unknown): PubBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeBlock).filter((b): b is PubBlock => b !== null);
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function arr(v: unknown): string[] {
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean);
  return [];
}

export type AdminPublicationPayload = Record<string, unknown>;

/**
 * Normalises an admin-editor payload into the canonical publication document.
 * Weeks (if a season is present) are re-derived from the season dates and
 * merged with any per-day content the editor provided.
 */
export function normalizePublication(
  payload: AdminPublicationPayload,
  existing?: PublicationDoc | null,
): { ok: true; doc: PublicationDoc } | { ok: false; error: string } {
  const id = str(payload.id);
  if (!id) return { ok: false, error: "A publication id/slug is required." };
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    return { ok: false, error: "id can only contain lowercase letters, numbers and dashes." };
  }

  const kind = payload.kind === "bulletin" ? "bulletin" : "magazine";
  const status = payload.status === "published" ? "published" : "draft";
  const series = str(payload.series) || undefined;
  const clubSlug = str(payload.clubSlug) || undefined;
  const title = str(payload.title) || series || id;
  const theme = str(payload.theme) || undefined;
  const cover = str(payload.cover);
  const summary = str(payload.summary);
  const coverLines = arr(payload.coverLines);
  const tags = arr(payload.tags);
  const blocks = sanitizeBlocks(payload.blocks);

  const year = Number(payload.year) > 0 ? Number(payload.year) : new Date().getUTCFullYear();

  // The Library matches magazines to a club by their club tag ("PRIME",
  // "SPROUT-KIDS"…), and /api/reading-today looks guides up the same way.
  // Guarantee the club tag exists — written uppercase so the editor can type
  // it in any case — instead of relying on the admin remembering to add it
  // by hand. Publications without a club are umbrella "Relate" content.
  const normalizedTags = tags
    .map((t) => t.toUpperCase())
    .filter((t, i, all) => all.indexOf(t) === i);
  const clubTag = (clubSlug || "RELATE").toUpperCase();
  if (!normalizedTags.includes(clubTag)) {
    normalizedTags.unshift(clubTag);
  }

  const seasonRaw = payload.season as Record<string, unknown> | null | undefined;
  const hasSeason =
    seasonRaw &&
    validISO(str(seasonRaw.start)) &&
    validISO(str(seasonRaw.end)) &&
    str(seasonRaw.start) <= str(seasonRaw.end);

  let season: PublicationDoc["season"];
  let weeks: PubWeek[] | undefined;
  if (hasSeason) {
    const start = str((seasonRaw as Record<string, unknown>).start);
    const end = str((seasonRaw as Record<string, unknown>).end);
    const seasonName = str((seasonRaw as Record<string, unknown>).name) || "Season";
    const seasonYear = Number((seasonRaw as Record<string, unknown>).year) || year;
    season = {
      name: seasonName,
      year: seasonYear,
      label: `${seasonName} ${seasonYear} · ${formatShortRange(start, end)}`,
      start,
      end,
    };
    weeks = buildSeasonWeeks(payload.weeks, start, end);
  }

  const month = str(payload.month) || (season ? monthNameOf(season.start) : "January");
  const issue = str(payload.issue) || (kind === "bulletin" ? `${title} Bulletin` : `Season of ${season?.name || ""} ${season?.year || year}`);

  const now = new Date();
  const publishedAt =
    status === "published"
      ? new Date(str((payload.publishedAt as string) || "") || (existing?.publishedAt as Date) || now)
      : null;

  const doc: PublicationDoc = {
    id,
    kind,
    ...(series ? { series } : {}),
    ...(clubSlug ? { clubSlug } : {}),
    title,
    issue,
    month,
    year,
    cover,
    summary,
    tags: normalizedTags,
    blocks,
    ...(season ? { season } : {}),
    ...(theme ? { theme } : {}),
    ...(coverLines.length ? { coverLines } : {}),
    ...(weeks ? { weeks } : {}),
    status,
    ...(publishedAt ? { publishedAt } : {}),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  return { ok: true, doc };
}

function buildSeasonWeeks(
  rawWeeks: unknown,
  start: string,
  end: string,
): PubWeek[] {
  const canonical = buildWeeks(start, end);
  const provided: Record<string, unknown>[] = Array.isArray(rawWeeks)
    ? rawWeeks.filter((w): w is Record<string, unknown> => !!w && typeof w === "object")
    : [];

  return canonical.map((cw, wIdx) => {
    const pw = provided[wIdx] || {};
    const topic = str(pw.topic);
    const rawDays = Array.isArray(pw.days)
      ? pw.days.filter((d): d is Record<string, unknown> => !!d && typeof d === "object")
      : [];

    const days: PubDay[] = cw.days.map((cd, dIdx) => {
      const pd = rawDays[dIdx] || {};
      const dayBlocks = sanitizeBlocks(pd.blocks).map((b) => withDayId(b, wIdx + 1, dIdx + 1));
      const verseText = str((pd as Record<string, unknown>).verseText);
      const verseBy = str((pd as Record<string, unknown>).verseBy);
      return {
        date: cd.date,
        day: cd.day,
        weekday: cd.weekday,
        title: str(pd.title) || "",
        ...(verseText || verseBy ? { verse: { text: verseText, ...(verseBy ? { by: verseBy } : {}) } } : {}),
        blocks: dayBlocks,
      };
    });

    const index = wIdx + 1;
    return {
      index,
      title: topic ? `Week ${index} — ${topic}` : `Week ${index}`,
      ...(topic ? { theme: topic } : {}),
      intro: sanitizeBlocks(pw.intro),
      days,
    };
  });
}

export function formatShortRange(startISO: string, endISO: string): string {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  const s = start.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  const e = end.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  return `${s} – ${e}`;
}

/** Human label for a magazine card, e.g. "Rooted 2026" / "Anchor Bulletin". */
export function magazineHeading(pub: PublicationDoc): string {
  if (pub.kind === "bulletin") return pub.title;
  return pub.series ? `${pub.series} ${pub.year}` : pub.title;
}

export function magazineClubLabel(pub: PublicationDoc): string {
  return clubName(pub.clubSlug);
}