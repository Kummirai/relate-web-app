import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import {
  listCalendars,
  normalizeCalendar,
  saveCalendar,
} from "@/lib/program-calendar";

/**
 * Admin program calendars (the year plan shown on club pages).
 *
 *   GET /api/admin/program-calendar?year=2027   Every calendar (optional year/clubSlug filter).
 *   PUT /api/admin/program-calendar             Upsert one club's year: { clubSlug, year, entries }.
 *
 * Saving replaces that club+year wholesale, so the admin editor always sends
 * the full list of entries it is showing.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const clubSlug = searchParams.get("clubSlug");

    const db = await getDb();
    let calendars = await listCalendars(
      db,
      yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : undefined,
    );
    if (clubSlug) {
      calendars = calendars.filter((cal) => cal.clubSlug === clubSlug.trim().toLowerCase());
    }
    return NextResponse.json({ data: calendars });
  } catch {
    return NextResponse.json({ error: "Failed to load calendars" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "A calendar payload is required." }, { status: 400 });
    }

    const body = payload as Record<string, unknown>;
    const result = normalizeCalendar(body.clubSlug, body.year, body.entries);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const db = await getDb();
    const saved = await saveCalendar(db, result.doc);
    return NextResponse.json({ success: true, data: saved });
  } catch {
    return NextResponse.json({ error: "Failed to save calendar" }, { status: 500 });
  }
}
