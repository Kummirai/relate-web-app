import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import {
  deleteCalendar,
  getCalendar,
  listCalendars,
} from "@/lib/program-calendar";

/**
 * One club's calendars.
 *
 *   GET    /api/admin/program-calendar/[clubSlug]?year=2027  One year (or every year).
 *   DELETE /api/admin/program-calendar/[clubSlug]?year=2027  Remove one year.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ clubSlug: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { clubSlug } = await params;
    const slug = String(clubSlug || "").trim().toLowerCase();
    if (!slug) return NextResponse.json({ error: "Club slug is required" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : undefined;

    const db = await getDb();
    if (typeof year === "number") {
      const calendar = await getCalendar(db, slug, year);
      return NextResponse.json({ data: calendar });
    }
    const calendars = await listCalendars(db);
    return NextResponse.json({
      data: calendars.filter((cal) => cal.clubSlug === slug),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load calendars" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ clubSlug: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { clubSlug } = await params;
    const slug = String(clubSlug || "").trim().toLowerCase();
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    if (!slug || !yearParam || !/^\d{4}$/.test(yearParam)) {
      return NextResponse.json({ error: "clubSlug and a 4-digit year are required" }, { status: 400 });
    }

    const db = await getDb();
    const removed = await deleteCalendar(db, slug, Number(yearParam));
    if (!removed) return NextResponse.json({ error: "Calendar not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete calendar" }, { status: 500 });
  }
}
