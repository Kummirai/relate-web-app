/**
 * Admin reading-plan document normalization.
 *
 * The admin editor (web_app/components/admin/ReadingPlanEditor.tsx) PUTs a
 * flat plan + sections payload; this shapes it into the MongoDB document the
 * public API (`lib/reading-plans.ts`) reads. Slug is the stable key.
 */

export type ReadingPlanSectionDoc = {
  id?: string;
  title: string;
  book: string | null;
  startCh: number | null;
  endCh: number | null;
  verseText: string | null;
  verseBy: string | null;
  blocks: unknown[] | null;
  sort: number;
};

export type ReadingPlanDoc = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  section: string;
  days: number;
  gradient: [string, string];
  image: string;
  status: "published" | "draft";
  sort: number;
  sections: ReadingPlanSectionDoc[];
  updatedAt: Date;
  createdAt?: Date;
};

const SLUG_RE = /^[a-z0-9-]{1,80}$/;

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function nullableStr(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function nullableInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function normalizeSections(raw: unknown): ReadingPlanSectionDoc[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i): ReadingPlanSectionDoc => {
      const s = (item ?? {}) as Record<string, unknown>;
      const blocks = Array.isArray(s.blocks) ? s.blocks : null;
      return {
        title: str(s.title).trim() || `Day ${i + 1}`,
        book: nullableStr(s.book),
        startCh: nullableInt(s.startCh),
        endCh: nullableInt(s.endCh),
        verseText: nullableStr(s.verseText),
        verseBy: nullableStr(s.verseBy),
        blocks,
        sort: i,
      };
    })
    .filter((s) => s.title || s.verseText || s.book || (s.blocks && s.blocks.length));
}

export type NormalizeResult =
  | { error: string }
  | { doc: Omit<ReadingPlanDoc, "createdAt"> };

export function normalizePlanInput(
  slug: string,
  payload: Record<string, unknown>,
): NormalizeResult {
  if (!SLUG_RE.test(slug)) {
    return { error: "Slug may only contain lowercase letters, numbers and dashes." };
  }
  const title = str(payload.title).trim();
  if (!title) return { error: "Title is required." };

  const daysRaw = Number(payload.days);
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.floor(daysRaw) : 1;
  const gradientRaw = Array.isArray(payload.gradient) ? payload.gradient : null;
  const gradient: [string, string] =
    gradientRaw && gradientRaw.length === 2 && typeof gradientRaw[0] === "string" && typeof gradientRaw[1] === "string"
      ? [gradientRaw[0], gradientRaw[1]]
      : ["#111827", "#1f2937"];

  const doc: Omit<ReadingPlanDoc, "createdAt"> = {
    slug,
    title,
    tagline: str(payload.tagline).trim(),
    description: str(payload.description).trim(),
    category: str(payload.category, "Bible Reading").trim() || "Bible Reading",
    section: str(payload.section).trim(),
    days,
    gradient,
    image: str(payload.image).trim(),
    status: payload.status === "published" ? "published" : "draft",
    sort: Number.isFinite(Number(payload.sort)) ? Math.floor(Number(payload.sort)) : 0,
    sections: normalizeSections(payload.sections),
    updatedAt: new Date(),
  };
  return { doc };
}
