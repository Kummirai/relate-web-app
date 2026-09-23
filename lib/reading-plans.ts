/**
 * Reading plans — public API data layer.
 *
 * Canonical fallback is the static catalog (mirrors web_app/constants/
 * readingPlans.ts) plus derived 5-chapter sections, so the endpoint works with
 * zero configuration. When Supabase is configured (reading_plans +
 * plan_sections tables), authored plans/sections are layered on top as the
 * live source of truth — the same merge the website performs client-side.
 */

import { fetchRows, isPublicSupabaseConfigured } from "@/lib/supabase-public";
import { sanitizePublicBlocks } from "@/lib/public-api/render";

export type RelateReadingPlan = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  section: string;
  days: number;
  gradient: [string, string];
  image: string;
};

export type PublicQuizQuestion = {
  id: string;
  book: string;
  chapter: number;
  question: string;
  options: string[];
};

export type PublicReadingSection = {
  id: string;
  planSlug: string;
  title: string;
  book: string | null;
  startCh: number | null;
  endCh: number | null;
  verseText?: string;
  verseBy?: string;
  blocks?: unknown[];
  sort: number;
  quiz?: PublicQuizQuestion[];
};

export type PublicPlan = {
  plan: RelateReadingPlan;
  sections: PublicReadingSection[];
};

export const READING_PLAN_CATEGORIES = [
  "Bible Reading",
  "Marriage & Relationships",
  "Emotional Wellness",
  "Academic",
  "Finance & Stewardship",
] as const;

export const CHAPTERS_PER_SECTION = 5;

export const READING_PLANS: RelateReadingPlan[] = [
  // ─── Bible Reading ──────────────────────────────
  {
    slug: "bible-in-a-year",
    title: "Bible in a Year",
    tagline: "The whole Bible in 365 days",
    description: "Read the entire Bible from Genesis to Revelation — roughly 3-4 chapters a day. The classic year-long journey through every book of Scripture.",
    category: "Bible Reading",
    section: "Whole Bible",
    days: 365,
    gradient: ["#7fb069", "#26502b"],
    image: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600&h=300&fit=crop",
  },
  {
    slug: "old-testament-in-180-days",
    title: "Old Testament in 180 Days",
    tagline: "Genesis to Malachi in six months",
    description: "Walk through all 39 books of the Old Testament — the Law, history, poetry and prophets — in a focused six-month journey.",
    category: "Bible Reading",
    section: "Old Testament",
    days: 180,
    gradient: ["#5c8d4e", "#a3c585"],
    image: "https://images.unsplash.com/photo-1533709752211-118fcaf03312?w=600&h=300&fit=crop",
  },
  {
    slug: "new-testament-in-90-days",
    title: "New Testament in 90 Days",
    tagline: "Gospels to Revelation in three months",
    description: "Read every chapter of the New Testament — from Matthew's Gospel to Revelation — in just ninety days, about three chapters a day.",
    category: "Bible Reading",
    section: "New Testament",
    days: 90,
    gradient: ["#ffc42e", "#c9971b"],
    image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=600&h=300&fit=crop",
  },
  {
    slug: "gospels-in-40-days",
    title: "Gospels in 40 Days",
    tagline: "The life of Jesus, cover to cover",
    description: "Immerse yourself in the four Gospels — Matthew, Mark, Luke and John — reading the full account of Jesus' life and ministry in forty days.",
    category: "Bible Reading",
    section: "New Testament",
    days: 40,
    gradient: ["#ffc42e", "#5c8d4e"],
    image: "https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600&h=300&fit=crop",
  },
  {
    slug: "pentateuch-in-60-days",
    title: "The Pentateuch in 60 Days",
    tagline: "Genesis, Exodus, Leviticus, Numbers, Deuteronomy",
    description: "Study the first five books of the Bible — creation, covenant, law and the journey of God's people — in sixty days.",
    category: "Bible Reading",
    section: "Old Testament",
    days: 60,
    gradient: ["#4caf50", "#5c8d4e"],
    image: "https://images.unsplash.com/photo-1473177104440-ffee2f376098?w=600&h=300&fit=crop",
  },
  {
    slug: "psalms-and-proverbs-in-31-days",
    title: "Psalms & Proverbs in 31 Days",
    tagline: "Five psalms and a proverb every day",
    description: "Pray through the Psalms and grow in wisdom through Proverbs — five psalms and one proverb a day for a full month.",
    category: "Bible Reading",
    section: "Wisdom",
    days: 31,
    gradient: ["#c9971b", "#7fb069"],
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=300&fit=crop",
  },

  // ─── Marriage & Relationships ───────────────────
  {
    slug: "marriage-in-30-days",
    title: "Marriage in 30 Days",
    tagline: "Build a marriage that honors God",
    description: "Explore God's design for marriage through 30 days of Scripture.",
    category: "Marriage & Relationships",
    section: "Marriage",
    days: 30,
    gradient: ["#e91e63", "#c2185b"],
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=300&fit=crop",
  },
  {
    slug: "love-and-conflict-in-21-days",
    title: "Love & Conflict in 21 Days",
    tagline: "Navigate disagreement with grace",
    description: "21 days of biblical wisdom for resolving conflict and building stronger relationships.",
    category: "Marriage & Relationships",
    section: "Conflict",
    days: 21,
    gradient: ["#ff7043", "#d84315"],
    image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=300&fit=crop",
  },
  {
    slug: "parenting-in-14-days",
    title: "Parenting in 14 Days",
    tagline: "Raise children who love God",
    description: "14 days of Scripture-based parenting wisdom for every season.",
    category: "Marriage & Relationships",
    section: "Parenting",
    days: 14,
    gradient: ["#ab47bc", "#7b1fa2"],
    image: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&h=300&fit=crop",
  },

  // ─── Emotional Wellness ─────────────────────────
  {
    slug: "peace-in-the-storm",
    title: "Peace in the Storm",
    tagline: "Find calm through faith",
    description: "21 days of biblical truth to anchor your heart in anxiety and fear.",
    category: "Emotional Wellness",
    section: "Anxiety",
    days: 21,
    gradient: ["#26a69a", "#00695c"],
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=300&fit=crop",
  },
  {
    slug: "hope-in-the-darkness",
    title: "Hope in the Darkness",
    tagline: "Light for seasons of despair",
    description: "21 days of hope-filled Scripture for depression, loss, and hard seasons.",
    category: "Emotional Wellness",
    section: "Depression",
    days: 21,
    gradient: ["#fdd835", "#f9a825"],
    image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600&h=300&fit=crop",
  },
  {
    slug: "casting-your-cares",
    title: "Casting Your Cares",
    tagline: "Surrender your worries to God",
    description: "21 days learning to cast every anxiety on the Lord through prayer.",
    category: "Emotional Wellness",
    section: "Worry",
    days: 21,
    gradient: ["#42a5f5", "#1565c0"],
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=300&fit=crop",
  },

  // ─── Finance & Stewardship ──────────────────────
  {
    slug: "budgeting-and-saving",
    title: "Budgeting & Saving",
    tagline: "Honor God with your finances",
    description: "21 days of biblical wisdom on stewardship, contentment, and generosity.",
    category: "Finance & Stewardship",
    section: "Budgeting",
    days: 21,
    gradient: ["#10b981", "#065f46"],
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=300&fit=crop",
  },
  {
    slug: "getting-out-of-debt",
    title: "Getting Out of Debt",
    tagline: "Break free from financial bondage",
    description: "21 days of practical, biblical steps to eliminate debt.",
    category: "Finance & Stewardship",
    section: "Debt Freedom",
    days: 21,
    gradient: ["#f43f5e", "#9f1239"],
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=300&fit=crop",
  },
  {
    slug: "building-wealth-wisely",
    title: "Building Wealth Wisely",
    tagline: "Grow resources for God's glory",
    description: "21 days on biblical wealth-building, generosity, and kingdom investing.",
    category: "Finance & Stewardship",
    section: "Wealth Building",
    days: 21,
    gradient: ["#8b5cf6", "#4c1d95"],
    image: "https://images.unsplash.com/photo-1553729459-uj0gfqcewkfd?w=600&h=300&fit=crop",
  },

  // ─── Academic ───────────────────────────────────
  {
    slug: "hermeneutics",
    title: "Hermeneutics",
    tagline: "How to study the Bible",
    description: "36-week guide to biblical interpretation — resources, practice labs, and master questions.",
    category: "Academic",
    section: "Interpretation",
    days: 50,
    gradient: ["#6366f1", "#312e81"],
    image: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600&h=300&fit=crop",
  },
  {
    slug: "theology",
    title: "Theology",
    tagline: "Systematic study of Christian doctrine",
    description: "30 weeks exploring all 11 categories of systematic theology.",
    category: "Academic",
    section: "Doctrine",
    days: 210,
    gradient: ["#0ea5e9", "#0c4a6e"],
    image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=600&h=300&fit=crop",
  },
  {
    slug: "apologetics",
    title: "Apologetics",
    tagline: "Defending the faith with grace",
    description: "21 weeks of biblical and historical evidence for the Christian faith.",
    category: "Academic",
    section: "Defense",
    days: 147,
    gradient: ["#14b8a6", "#134e4a"],
    image: "https://images.unsplash.com/photo-1457369804613-52c61a422e7f?w=600&h=300&fit=crop",
  },
  {
    slug: "biblical-studies",
    title: "Biblical Studies",
    tagline: "Survey of every book of the Bible",
    description: "14 weeks surveying both Testaments — every book, genre, and theme.",
    category: "Academic",
    section: "Survey",
    days: 98,
    gradient: ["#a78bfa", "#4c1d95"],
    image: "https://images.unsplash.com/photo-1473177104440-ffee2f376098?w=600&h=300&fit=crop",
  },
  {
    slug: "church-history",
    title: "Church History",
    tagline: "Two thousand years of God's faithfulness",
    description: "20 weeks tracing the Christian church from AD 30 to today.",
    category: "Academic",
    section: "History",
    days: 140,
    gradient: ["#f59e0b", "#78350f"],
    image: "https://images.unsplash.com/photo-1548407260-da850faa41e8?w=600&h=300&fit=crop",
  },
  {
    slug: "spiritual-disciplines",
    title: "Spiritual Disciplines",
    tagline: "Practices that draw you closer to God",
    description: "12 weeks cultivating the core spiritual disciplines of the Christian life.",
    category: "Academic",
    section: "Practice",
    days: 84,
    gradient: ["#22c55e", "#14532d"],
    image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=600&h=300&fit=crop",
  },
];

export function getReadingPlan(slug: string): RelateReadingPlan | undefined {
  return READING_PLANS.find((p) => p.slug === slug);
}

/*
 * Pentateuch sections — the flagship Bible Reading plan. 5-chapter blocks so
 * reading five chapters unlocks that section's quiz (mirrors the website).
 */
const PENTATEUCH_SECTIONS: [string, string, number, number][] = [
  ["Genesis", "In the Beginning", 1, 5],
  ["Genesis", "Noah's Flood", 6, 10],
  ["Genesis", "Abraham Called", 11, 16],
  ["Genesis", "Isaac & Jacob", 17, 24],
  ["Genesis", "Jacob & Joseph", 25, 31],
  ["Genesis", "Joseph in Egypt", 32, 41],
  ["Genesis", "Joseph's Reunion", 42, 50],
  ["Exodus", "Moses Called", 1, 5],
  ["Exodus", "Out of Egypt", 6, 11],
  ["Exodus", "The Red Sea", 12, 18],
  ["Exodus", "The Law at Sinai", 19, 24],
  ["Exodus", "The Tabernacle", 25, 34],
  ["Exodus", "God With Us", 35, 40],
  ["Leviticus", "Holy Ground", 1, 5],
  ["Leviticus", "A Priest's Work", 6, 10],
  ["Leviticus", "Clean & Unclean", 11, 15],
  ["Leviticus", "The Day of Atonement", 16, 20],
  ["Leviticus", "Be Holy", 21, 26],
  ["Numbers", "The Census", 1, 5],
  ["Numbers", "The Nazirite", 6, 10],
  ["Numbers", "Grumbling", 11, 16],
  ["Numbers", "The Bronze Serpent", 17, 21],
  ["Numbers", "Balaam & the New Generation", 22, 28],
  ["Numbers", "Toward the Promised Land", 29, 36],
  ["Deuteronomy", "Words of Moses", 1, 5],
  ["Deuteronomy", "Love the Lord", 6, 10],
  ["Deuteronomy", "Blessing & Curse", 11, 16],
  ["Deuteronomy", "The King List", 17, 21],
  ["Deuteronomy", "Land & Inheritance", 22, 26],
  ["Deuteronomy", "The New Covenant", 27, 34],
];

const PENTATEUCH_SLUGS = new Set([
  "pentateuch-in-60-days",
  "old-testament-in-180-days",
]);

function buildSections(planSlug: string): PublicReadingSection[] {
  return PENTATEUCH_SECTIONS.map(([book, title, startCh, endCh], i) => ({
    id: `${planSlug}-${book.toLowerCase()}-${startCh}`,
    planSlug,
    title,
    book,
    startCh,
    endCh,
    sort: i,
  }));
}

function buildGenericSections(plan: RelateReadingPlan): PublicReadingSection[] {
  const dayChunks = Array.from(
    { length: Math.max(1, Math.ceil(plan.days / CHAPTERS_PER_SECTION)) },
    (_, i) => ({
      startCh: i * CHAPTERS_PER_SECTION + 1,
      endCh: (i + 1) * CHAPTERS_PER_SECTION,
    }),
  );
  return dayChunks.map(({ startCh, endCh }, i) => ({
    id: `${plan.slug}-${plan.section?.toLowerCase().replace(/[^a-z]+/g, "-") || i}-${startCh}`,
    planSlug: plan.slug,
    title: `Section ${i + 1}`,
    book: plan.section || plan.category,
    startCh,
    endCh,
    sort: i,
  }));
}

export function getPlanSections(plan: RelateReadingPlan): PublicReadingSection[] {
  const sections = PENTATEUCH_SLUGS.has(plan.slug)
    ? buildSections(plan.slug)
    : buildGenericSections(plan);
  return sections.map((s) => ({ ...s, quiz: quizForSection(s) }));
}

// ─── Public section quizzes (no answers) ────────────────────────────────
type BankQuestion = { book: string; chapter: number; question: string; options: string[] };

const BASE_QUESTIONS: BankQuestion[] = [
  { book: "Genesis", chapter: 1, question: "What did God create on day one?", options: ["Light", "The sun", "Fish", "Adam"] },
  { book: "Genesis", chapter: 2, question: "Where did God plant the garden for Adam?", options: ["Eden", "Egypt", "Canaan", "Babel"] },
  { book: "Genesis", chapter: 6, question: "What did Noah build to save his family?", options: ["An ark", "A tower", "A tent", "A wall"] },
  { book: "Genesis", chapter: 12, question: "Who did God call to leave Ur and follow him?", options: ["Abraham", "Moses", "David", "Jacob"] },
  { book: "Exodus", chapter: 3, question: "From what burning place did God call Moses?", options: ["A bush", "A mountain", "A cloud", "A fire"] },
  { book: "Exodus", chapter: 20, question: "How many commandments did God give on the mountain?", options: ["Ten", "Five", "Twelve", "Seven"] },
];

function quizForSection(section: PublicReadingSection): PublicQuizQuestion[] | undefined {
  if (!section.book || section.startCh == null || section.endCh == null) return undefined;
  const questions = BASE_QUESTIONS.filter(
    (q) =>
      q.book === section.book &&
      q.chapter >= section.startCh &&
      q.chapter <= section.endCh,
  );
  if (questions.length === 0) {
    const first = BASE_QUESTIONS.find((q) => q.book === section.book);
    if (!first) return undefined;
    questions.push(first);
  }
  return questions.map((q) => ({
    id: `${section.planSlug}-${q.book.toLowerCase()}-${q.chapter}`,
    book: q.book,
    chapter: q.chapter,
    question: q.question,
    options: q.options,
  }));
}

// ─── Supabase-authored overlay ───────────────────────────────────────────
type AuthoredPlanRow = {
  slug: string;
  title?: string;
  tagline?: string;
  description?: string;
  category?: string;
  section?: string;
  days?: number;
  image?: string;
  cover?: string;
  gradient?: string[];
  status?: string;
};

type AuthoredSectionRow = {
  id?: string;
  title?: string;
  book?: string | null;
  start_ch?: number | null;
  end_ch?: number | null;
  verse_text?: string | null;
  verse_by?: string | null;
  blocks?: unknown[] | null;
  sort?: number;
};

const PLAN_SELECT =
  "slug,title,tagline,description,category,section,days,image,cover,gradient,status";
const SECTION_SELECT =
  "id,title,book,start_ch,end_ch,verse_text,verse_by,blocks,sort";

function planFromRow(row: AuthoredPlanRow): RelateReadingPlan {
  const base = getReadingPlan(row.slug);
  return {
    slug: row.slug,
    title: row.title ?? base?.title ?? row.slug,
    tagline: row.tagline ?? base?.tagline ?? "",
    description: row.description ?? base?.description ?? "",
    category: row.category ?? base?.category ?? "Bible Reading",
    section: row.section ?? base?.section ?? "",
    days: typeof row.days === "number" ? row.days : base?.days ?? 5,
    gradient:
      Array.isArray(row.gradient) && row.gradient.length === 2
        ? (row.gradient as [string, string])
        : (base?.gradient ?? (["#111827", "#1f2937"] as [string, string])),
    image: row.image ?? row.cover ?? base?.image ?? "",
  };
}

function isPublicPlan(row: AuthoredPlanRow): boolean {
  return !row.status || row.status === "published";
}

async function listAuthoredPlans(): Promise<RelateReadingPlan[]> {
  if (!isPublicSupabaseConfigured) return [];
  const rows = await fetchRows<AuthoredPlanRow>("reading_plans", {
    select: PLAN_SELECT,
    order: "days.asc",
  });
  return rows.filter(isPublicPlan).map(planFromRow);
}

function sectionFromRow(
  row: AuthoredSectionRow,
  planSlug: string,
  fallbackSort: number,
): PublicReadingSection {
  const sort = typeof row.sort === "number" ? row.sort : fallbackSort;
  const section: PublicReadingSection = {
    id: row.id || `${planSlug}-section-${fallbackSort}`,
    planSlug,
    title: row.title ?? `Section ${fallbackSort + 1}`,
    book: row.book ?? null,
    startCh: typeof row.start_ch === "number" ? row.start_ch : null,
    endCh: typeof row.end_ch === "number" ? row.end_ch : null,
    verseText: row.verse_text ?? undefined,
    verseBy: row.verse_by ?? undefined,
    blocks: row.blocks ? (sanitizePublicBlocks(row.blocks) as unknown as unknown[]) : undefined,
    sort,
  };
  return section;
}

async function getAuthoredPlan(
  slug: string,
): Promise<{ plan: RelateReadingPlan; sections: PublicReadingSection[] } | null> {
  if (!isPublicSupabaseConfigured) return null;
  const [rows, sectionRows] = await Promise.all([
    fetchRows<AuthoredPlanRow>("reading_plans", {
      select: PLAN_SELECT,
      filters: { slug: `eq.${slug}` },
    }).then((rs) => (rs.length ? rs : null)),
    fetchRows<AuthoredSectionRow>("plan_sections", {
      select: SECTION_SELECT,
      filters: { plan_slug: `eq.${slug}` },
      order: "sort.asc",
    }),
  ]);
  if (!rows || !isPublicPlan(rows[0])) return null;

  const plan = planFromRow(rows[0]);
  const derived = sectionRows.length === 0;
  const sections = derived
    ? getPlanSections(plan)
    : sectionRows.map((r, i) => {
        const s = sectionFromRow(r, slug, i);
        return { ...s, quiz: quizForSection(s) };
      });
  return { plan, sections };
}

// ─── Public surface ──────────────────────────────────────────────────────
/** Union of the static catalog overlaid with any authored plans. */
export async function listPublicPlans(): Promise<RelateReadingPlan[]> {
  const authored = await listAuthoredPlans();
  if (authored.length === 0) return READING_PLANS;

  const bySlug = new Map<string, RelateReadingPlan>();
  for (const p of READING_PLANS) bySlug.set(p.slug, p);
  for (const p of authored) bySlug.set(p.slug, p);
  return [...bySlug.values()];
}

export async function getPublicPlan(slug: string): Promise<PublicPlan | null> {
  if (!slug || !/^[a-z0-9-]{1,80}$/i.test(slug)) return null;
  const authored = await getAuthoredPlan(slug);
  if (authored) return authored;

  const plan = getReadingPlan(slug);
  if (!plan) return null;
  return { plan, sections: getPlanSections(plan) };
}