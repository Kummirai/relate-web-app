import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Parse a period string like "July 2026" or "Jul 2026" into a start/end
 * date range. Returns null when the string doesn't match.
 */
function parsePeriod(period: string): { start: Date; end: Date } | null {
  const trimmed = period.trim();
  // Try "MonthName YYYY" or "Mon YYYY"
  const m = trimmed.match(/^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})$/i);
  if (!m) return null;

  const monthIndex = MONTHS.findIndex(
    (abbr) => abbr.toLowerCase() === m[1].slice(0, 3).toLowerCase(),
  );
  if (monthIndex < 0) return null;

  const year = parseInt(m[2], 10);
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1); // exclusive upper bound
  return { start, end };
}

/** Return the period string for the month before the given period. */
function previousPeriod(period: string): string | null {
  const trimmed = period.trim();
  const m = trimmed.match(/^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})$/i);
  if (!m) return null;

  const monthIndex = MONTHS.findIndex(
    (abbr) => abbr.toLowerCase() === m[1].slice(0, 3).toLowerCase(),
  );
  if (monthIndex < 0) return null;

  const year = parseInt(m[2], 10);
  if (monthIndex === 0) return `December ${year - 1}`;
  return `${FULL_MONTHS[monthIndex - 1]} ${year}`;
}

/**
 * Admin-only: for a given period, aggregate:
 *  - Sponsorship income (approved pledges created that month)
 *  - Amounts used from action logs (sum of actionLog[].amountsUsed in family
 *    records whose action date falls in that month)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const period = url.searchParams.get("period");
    if (!period) {
      return NextResponse.json(
        { error: "Period query parameter is required" },
        { status: 400 },
      );
    }

    const range = parsePeriod(period);
    if (!range) {
      return NextResponse.json(
        { error: "Could not parse period. Use a format like 'July 2026'." },
        { status: 400 },
      );
    }

    const db = await getDb();

    const prevPeriod = previousPeriod(period);

    const [sponsorshipAgg, records, prevReport] = await Promise.all([
      // Total approved sponsorship income for the month.
      db
        .collection("sponsorships")
        .aggregate([
          {
            $match: {
              status: "approved",
              createdAt: { $gte: range.start, $lt: range.end },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ])
        .toArray(),

      // All family records that have at least one action log entry in range.
      db
        .collection("familyrecords")
        .find({
          "actionLog.date": { $gte: range.start.toISOString(), $lt: range.end.toISOString() },
        })
        .project({ actionLog: 1 })
        .toArray(),

      // Most recent published report whose period matches the previous month.
      // Using period (not createdAt) because reports are often saved after
      // the month they cover.
      prevPeriod
        ? db
            .collection("financial_reports")
            .find({
              $or: [{ status: "published" }, { status: { $exists: false } }],
              period: prevPeriod,
            })
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray()
        : Promise.resolve([]),
    ]);

    const sponsorships = sponsorshipAgg[0]?.total ?? 0;

    // Sum amountsUsed across all matching action log entries.
    let amountsUsed = 0;
    for (const rec of records) {
      const startMs = range.start.getTime();
      const endMs = range.end.getTime();
      for (const entry of rec.actionLog ?? []) {
        const d = new Date(entry.date);
        if (isNaN(d.getTime()) || d.getTime() < startMs || d.getTime() >= endMs) continue;
        const amt = parseFloat(String(entry.amountsUsed ?? ""));
        if (Number.isFinite(amt) && amt > 0) amountsUsed += amt;
      }
    }

    // Balance brought down = net from the previous month's report.
    let balanceBroughtDown = 0;
    if (prevReport.length > 0) {
      const pr = prevReport[0];
      const pi =
        (Number(pr.income?.balanceBroughtDown) || 0) +
        (Number(pr.income?.sponsorships) || 0) +
        (Number(pr.income?.events) || 0) +
        (Number(pr.income?.donations) || 0) +
        (Number(pr.income?.books) || 0) +
        (Number(pr.income?.other) || 0);
      const pe =
        (Number(pr.expenses?.meals) || 0) +
        (Number(pr.expenses?.groceries) || 0) +
        (Number(pr.expenses?.tuition) || 0) +
        (Number(pr.expenses?.transport) || 0) +
        (Number(pr.expenses?.employment) || 0) +
        (Number(pr.expenses?.materials) || 0) +
        (Number(pr.expenses?.other) || 0) +
        (Number(pr.expenses?.amountsFromRecords) || 0);
      balanceBroughtDown = Math.round((pi - pe) * 100) / 100;
    }

    return NextResponse.json({
      data: {
        sponsorships: Math.round(sponsorships * 100) / 100,
        amountsUsed: Math.round(amountsUsed * 100) / 100,
        balanceBroughtDown,
        period,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch financial report data" },
      { status: 500 },
    );
  }
}
