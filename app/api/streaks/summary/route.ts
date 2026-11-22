import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveUser } from "@/lib/community-auth";
import { withCpuTiming } from "@/lib/api-timing";

type SummaryData = {
  streaks: Record<string, unknown>;
  days: string[];
};

const summaryCache = new Map<string, { data: SummaryData; ts: number }>();
const SUMMARY_TTL = 60_000;

async function handleGet(request: NextRequest) {
  try {
    const userId = await resolveUser(request);
    if (!userId) {
      return NextResponse.json({ data: { streaks: {}, days: [] } });
    }

    const cached = summaryCache.get(userId);
    if (cached && Date.now() - cached.ts < SUMMARY_TTL) {
      return NextResponse.json({ data: cached.data });
    }

    const db = await getDb();
    const [streakDoc, readingDoc] = await Promise.all([
      db.collection("user_streaks").findOne({ userId }),
      db.collection("reading_streaks").findOne({ userId }),
    ]);
    const data: SummaryData = {
      streaks:
        streakDoc?.streaks && typeof streakDoc.streaks === "object"
          ? (streakDoc.streaks as Record<string, unknown>)
          : {},
      days: Array.isArray(readingDoc?.days) ? readingDoc.days : [],
    };
    summaryCache.set(userId, { data, ts: Date.now() });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: { streaks: {}, days: [] } });
  }
}

export const GET = withCpuTiming("streaks/summary.GET", handleGet);
