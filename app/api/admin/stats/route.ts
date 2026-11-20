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

// Per-club monthly counts, keyed by the club slug stored on the record.
function monthlyCountsByClub(
  records: { clubSlug?: unknown; createdAt?: unknown }[],
): Map<string, Map<string, number>> {
  const byClub = new Map<string, Map<string, number>>();
  for (const record of records) {
    const slug = typeof record.clubSlug === "string" ? record.clubSlug.trim() : "";
    if (!slug) continue;
    const date = toDate(record.createdAt);
    if (!date) continue;
    const bucket = byClub.get(slug) ?? new Map<string, number>();
    const month = monthKey(date);
    bucket.set(month, (bucket.get(month) ?? 0) + 1);
    byClub.set(slug, bucket);
  }
  return byClub;
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

    const [
      totalUsers,
      admins,
      newUsers,
      families,
      userDocs,
      familyDocs,
      clubMemberDocs,
      clubDocs,
      app,
    ] = await Promise.all([
      db.collection("user").countDocuments(),
      db.collection("user").countDocuments({ role: "admin" }),
      db.collection("user").countDocuments(recent),
      db.collection("familyrecords").countDocuments(),
      db.collection("user").find({}, { projection: { createdAt: 1 } }).toArray(),
      db.collection("familyrecords").find({}, { projection: { createdAt: 1 } }).toArray(),
      db.collection("club_join_applications")
        .find({ status: "active" }, { projection: { createdAt: 1, clubSlug: 1 } })
        .toArray(),
      db.collection("clubs")
        .find({}, { projection: { slug: 1, name: 1, color: 1, colorDark: 1 } })
        .toArray(),
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

    const membersByClub = monthlyCountsByClub(clubMemberDocs);
    type ClubMeta = { name: string; color: string };
    const clubInfo = new Map<string, ClubMeta>();
    for (const club of clubDocs as any[]) {
      clubInfo.set(club.slug, {
        name: club.name || club.slug,
        color: club.colorDark || club.color || "",
      });
    }
    const clubOrder = (clubDocs as any[]).map((club) => club.slug as string);
    for (const slug of membersByClub.keys()) {
      if (clubInfo.has(slug)) continue;
      clubInfo.set(slug, {
        name: slug.replace(/(^|-)([a-z])/g, (_m, dash: string, c: string) =>
          `${dash === "-" ? " " : ""}${c.toUpperCase()}`,
        ),
        color: "",
      });
      clubOrder.push(slug);
    }
    // Age ladder order, so the chips read Sprout classes → Sprout → Surge …
    const LADDER = [
      "sprout-kids",
      "sprout-tweens",
      "sprout-teens",
      "sprout",
      "surge",
      "pulse",
      "prime",
      "anchor",
      "spark",
      "synergy",
    ];
    clubOrder.sort((a, b) => {
      const ai = LADDER.indexOf(a);
      const bi = LADDER.indexOf(b);
      return (ai === -1 ? LADDER.length : ai) - (bi === -1 ? LADDER.length : bi);
    });
    const clubSeries = clubOrder.map((slug) => ({
      slug,
      name: clubInfo.get(slug)?.name ?? slug,
      color: clubInfo.get(slug)?.color ?? "",
      members: cumulative(membersByClub.get(slug) ?? new Map<string, number>(), months),
    }));

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
          clubs: clubSeries,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
