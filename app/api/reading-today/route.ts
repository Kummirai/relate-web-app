import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

/**
 * GET /api/reading-today?tag=RELATE&date=2026-09-12
 * Finds the day to open for a club's guided reading: exact date first, then
 * the next upcoming day, then the first day of the guide. Returns a compact
 * { slug, week, day, date } target so the home shortcut can deep-link
 * straight into a day without shipping every guide's weeks.
 */
type Target = { slug: string; week: number; day: number; date: string };

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const tag = (params.get("tag") || "RELATE").toUpperCase();
    const date = params.get("date") || todayKey();

    const db = await getDb();
    const pubs = await db
      .collection("publications")
      .find({ status: "published", kind: "magazine", tags: tag as string })
      .sort({ publishedAt: -1 })
      .project({ weeks: 1, id: 1 })
      .toArray();
    void db;

    let exact: Target | undefined;
    let next: Target | undefined;
    let first: Target | undefined;
    for (const p of pubs) {
      const weeks: unknown = p.weeks;
      if (!Array.isArray(weeks)) continue;
      for (let w = 0; w < weeks.length; w++) {
        const days: unknown = (weeks[w] as { days?: unknown }).days;
        if (!Array.isArray(days)) continue;
        for (let d = 0; d < days.length; d++) {
          const dayDate: unknown = (days[d] as { date?: unknown }).date;
          if (typeof dayDate !== "string") continue;
          if (!first) first = { slug: p.id as string, week: w, day: d, date: dayDate };
          if (dayDate === date) exact = { slug: p.id as string, week: w, day: d, date: dayDate };
          if (!next && dayDate > date) next = { slug: p.id as string, week: w, day: d, date: dayDate };
        }
      }
    }

    const target = exact || next || first;
    return NextResponse.json(target ? { found: true, ...target } : { found: false });
  } catch {
    return NextResponse.json({ found: false });
  }
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}