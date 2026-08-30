import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// Cache stats for 5 minutes to avoid running countDocuments on every request.
// In serverless, this survives warm instances but resets on cold starts —
// that's fine since cold starts are infrequent and the first request is cheap.
let statsCache: { data: { est: string; downloads: number; families: number }; ts: number } | null = null;
const STATS_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    if (statsCache && Date.now() - statsCache.ts < STATS_TTL) {
      return NextResponse.json(statsCache.data, {
        headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
      });
    }

    const db = await getDb();
    const [downloads, families] = await Promise.all([
      db.collection("user").countDocuments(),
      db.collection("familyrecords").countDocuments(),
    ]);

    const data = { est: "Jan 2026", downloads, families };
    statsCache = { data, ts: Date.now() };

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
