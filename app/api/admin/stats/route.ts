import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import { getAppDownloadStats } from "@/lib/app-download-stats";

const MONTHS = 12;

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastMonths(now: Date) {
  return Array.from({ length: MONTHS }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - index), 1);
    return {
      key: monthKey(date),
      label: date.toLocaleString("en-US", { month: "short" }),
    };
  });
}

function toDate(value: unknown): Date | null {
  const date = value instanceof Date ? value : new Date(String(value ?? ""));
  return value && !Number.isNaN(date.getTime()) ? date : null;
}

function monthlyCounts(records: { createdAt?: unknown }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const record of records) {
    const date = toDate(record.createdAt);
    if (!date) continue;
    const key = monthKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function cumulative(counts: Map<string, number>, months: { key: string }[]): number[] {
  const first = months[0].key;
  let running = 0;
  for (const [key, value] of counts) {
    if (key < first) running += value;
  }
  return months.map((month) => {
    running += counts.get(month.key) ?? 0;
    return running;
  });
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = await getDb();
    const now = new Date();
    const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recent = {
      $or: [{ createdAt: { $gte: since } }, { createdAt: { $gte: since.toISOString() } }],
    };

    const [totalUsers, admins, newUsers, families, userDocs, familyDocs, app] =
      await Promise.all([
        db.collection("user").countDocuments(),
        db.collection("user").countDocuments({ role: "admin" }),
        db.collection("user").countDocuments(recent),
        db.collection("familyrecords").countDocuments(),
        db.collection("user").find({}, { projection: { createdAt: 1 } }).toArray(),
        db.collection("familyrecords").find({}, { projection: { createdAt: 1 } }).toArray(),
        getAppDownloadStats(),
      ]);

    const months = lastMonths(now);
    const downloads = new Map<string, number>();
    for (const release of app?.history ?? []) {
      const date = toDate(release.publishedAt);
      if (!date) continue;
      const key = monthKey(date);
      downloads.set(key, (downloads.get(key) ?? 0) + release.downloads);
    }

    const userTotals = cumulative(monthlyCounts(userDocs), months);
    const familyTotals = cumulative(monthlyCounts(familyDocs), months);
    const downloadTotals = cumulative(downloads, months);

    return NextResponse.json({
      data: {
        members: { total: totalUsers, admins, newLast30Days: newUsers, families },
        growth: {
          months: months.map((month, index) => ({
            label: month.label,
            users: userTotals[index],
            families: familyTotals[index],
            downloads: downloadTotals[index],
          })),
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
