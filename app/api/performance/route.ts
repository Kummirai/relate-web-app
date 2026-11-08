import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";

const TARGET = 33_000;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SEASONS = [
  { name: "Autumn", ends: "March" },
  { name: "Winter", ends: "June" },
  { name: "Spring", ends: "September" },
  { name: "Summer", ends: "December" },
];

/** Report periods are free text; accept "July 2026" / "Jul 2026". */
function parsePeriod(period: unknown): { year: number; month: number } | null {
  if (typeof period !== "string") return null;
  const m = period
    .trim()
    .match(
      /^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})$/i,
    );
  if (!m) return null;
  const month = MONTHS.findIndex(
    (name) => name.slice(0, 3).toLowerCase() === m[1].slice(0, 3).toLowerCase(),
  );
  if (month < 0) return null;
  return { year: parseInt(m[2], 10), month };
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const INCOME_LABELS: Record<string, string> = {
  balanceBroughtDown: "Balance brought down",
  sponsorships: "Sponsorships",
  events: "Events",
  donations: "Donations",
  books: "Books & resources",
  other: "Other income",
};

/** "amountsFromRecords" → "Amounts from records". */
function humanize(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/**
 * Every amount the report actually carries. Field names are read from the
 * document itself, so a new income or expense line is summed as soon as it is
 * filed — nothing here enumerates the report's sections.
 */
function sectionTotal(section: unknown): number {
  if (!section || typeof section !== "object") return 0;
  let total = 0;
  for (const [key, value] of Object.entries(section as Record<string, unknown>)) {
    if (/description$/i.test(key)) continue;
    const n = typeof value === "string" ? Number(value) : value;
    if (typeof n === "number" && Number.isFinite(n)) total += n;
  }
  return total;
}

function amount(section: any, key: string): number {
  const value = section?.[key];
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function incomeOf(doc: any): number {
  return sectionTotal(doc?.income);
}

function expenditureOf(doc: any): number {
  return sectionTotal(doc?.expenses);
}

/** Money raised this period — report income less the balance it carried in,
 * which was already counted in the month it was earned. */
function raisedOf(doc: any): number {
  return incomeOf(doc) - amount(doc?.income, "balanceBroughtDown");
}

function currentSeason(date: Date) {
  return SEASONS[Math.floor(date.getMonth() / 3)];
}

/**
 * Signed-in members: organisation performance for the requested year, built
 * from published financial reports only. Department and individual scores are
 * not part of this endpoint — they arrive with the seasonal appraisals.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const requestedYear = Number(
      new URL(request.url).searchParams.get("year") ?? "",
    );
    const now = new Date();
    let year = Number.isInteger(requestedYear) && requestedYear > 2000
      ? requestedYear
      : now.getFullYear();

    const docs = await db
      .collection("financial_reports")
      .find({ $or: [{ status: "published" }, { status: { $exists: false } }] })
      .sort({ createdAt: -1 })
      .limit(120)
      .toArray();

    const parsed = docs
      .map((doc: any) => ({ doc, period: parsePeriod(doc.period) }))
      .filter((entry: any) => entry.period);

    let yearEntries = parsed.filter((entry: any) => entry.period.year === year);
    if (yearEntries.length === 0 && parsed.length > 0) {
      // Reports may be filed under a different year than "today" on the
      // device — show the newest year on record rather than an empty screen.
      year = parsed[0].period.year as number;
      yearEntries = parsed.filter((entry: any) => entry.period.year === year);
    }

    // One entry per month: the most recently created report wins.
    const byMonth = new Map<number, any>();
    for (const entry of yearEntries) {
      const month = entry.period.month as number;
      if (!byMonth.has(month)) byMonth.set(month, entry.doc);
    }

    const ordered = [...byMonth.entries()].sort((a, b) => a[0] - b[0]);
    const windowed = ordered.slice(-10);

    const months = windowed.map(([month, doc]) => {
      const income = incomeOf(doc);
      const expenses = expenditureOf(doc);
      return {
        month,
        label: MONTHS[month].slice(0, 3),
        period: doc.period,
        income,
        expenses,
        net: income - expenses,
        raised: raisedOf(doc),
      };
    });

    const totals = months.reduce(
      (acc, m) => ({
        income: acc.income + m.income,
        expenses: acc.expenses + m.expenses,
      }),
      { income: 0, expenses: 0 },
    );

    // Every income key that appears in the windowed reports, with the amount
    // actually filed under it.
    const mixKeys = new Set<string>();
    for (const [, doc] of windowed) {
      for (const [key, value] of Object.entries(doc?.income ?? {})) {
        if (/description$/i.test(key)) continue;
        const n = typeof value === "string" ? Number(value) : value;
        if (typeof n === "number" && Number.isFinite(n) && n !== 0) {
          mixKeys.add(key);
        }
      }
    }
    const incomeMix = [...mixKeys]
      .map((key) => ({
        key,
        label: INCOME_LABELS[key] ?? humanize(key),
        value: windowed.reduce(
          (sum, [, doc]) => sum + amount(doc?.income, key),
          0,
        ),
      }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value);

    const latestDoc = yearEntries[0]?.doc ?? null;
    const latestImpact = latestDoc?.impact
      ? {
          families: num(latestDoc.impact.families),
          mealsServed: num(latestDoc.impact.mealsServed),
          children: num(latestDoc.impact.children),
          placements: num(latestDoc.impact.placements),
          events: num(latestDoc.impact.events),
        }
      : null;

    const raised = months.reduce((sum, m) => sum + m.raised, 0);
    // The newest month's net is the report's closing balance — the funds the
    // account actually holds.
    const balance = months.length > 0 ? months[months.length - 1].net : 0;
    const season = currentSeason(now);

    return NextResponse.json({
      data: {
        year,
        target: TARGET,
        coffer: {
          raised,
          target: TARGET,
          remaining: Math.max(0, TARGET - raised),
          progressPct: Math.min(999, Math.round((raised / TARGET) * 100)),
        },
        balance,
        totals,
        months,
        incomeMix,
        latestImpact,
        latestReport: latestDoc
          ? {
              period: latestDoc.period,
              preparedBy: latestDoc.preparedBy ?? null,
              createdAt: latestDoc.createdAt ?? null,
            }
          : null,
        reportCount: yearEntries.length,
        season: {
          name: season.name,
          ends: season.ends,
          year: now.getFullYear(),
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load organisation performance" },
      { status: 500 },
    );
  }
}
