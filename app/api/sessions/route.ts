import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { createSession, ensureSessionIndexes, slotInAvailability } from "@/lib/sessions";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const BOOKING_WINDOW_DAYS = 14;
const ALLOWED_DURATIONS = [30, 45, 60];

function gradeInRange(grade, gradeRanges) {
  for (const range of gradeRanges || []) {
    const bounds = String(range)
      .split(/[–—\-–]/, 2)
      .map((s) => parseInt(s.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const min = bounds.length > 0 ? bounds[0] : (bounds[1] ?? null);
    const max = bounds.length > 1 ? bounds[1] : min;
    if (min !== null && max !== null && grade >= min && grade <= max) return true;
  }
  return false;
}

/** Book a tutor session for the signed-in user. Slot uniqueness is enforced
 * by the partial unique index on (tutorId, date, time) — a race between two
 * students both picking the same free slot lets exactly one insert win. */
export async function POST(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    await ensureSessionIndexes();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const tutorId = String(body.tutorId ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const topic = String(body.topic ?? "").trim();
    const club = String(body.club ?? "").trim() || null;
    const date = String(body.date ?? "").trim();
    const time = String(body.time ?? "").trim();
    let grade = Number(body.grade);
    let durationMin = Number(body.durationMin);

    if (!tutorId || !subject || !topic || !date || !time) {
      return NextResponse.json({ error: "Missing session details" }, { status: 400 });
    }
    if (!DATE_RE.test(date) || !TIME_RE.test(time)) {
      return NextResponse.json({ error: "Invalid date or time" }, { status: 400 });
    }
    if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
      return NextResponse.json({ error: "Grade must be between 1 and 12" }, { status: 400 });
    }
    if (!ALLOWED_DURATIONS.includes(durationMin)) {
      durationMin = 60;
    }

    const start = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const windowEnd = new Date(today);
    windowEnd.setDate(windowEnd.getDate() + BOOKING_WINDOW_DAYS);
    if (start < today || start > windowEnd) {
      return NextResponse.json(
        { error: "Please pick a date within the next two weeks" },
        { status: 400 },
      );
    }

    const tutor = await db
      .collection("tutors")
      .findOne({ id: tutorId, active: true }, { projection: { email: 0 } });
    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }
    if (!(tutor.subjects || []).includes(subject)) {
      return NextResponse.json({ error: "Subject not offered by this tutor" }, { status: 400 });
    }
    if (!gradeInRange(grade, tutor.gradeRanges || [])) {
      return NextResponse.json(
        { error: "This tutor does not cover that grade" },
        { status: 400 },
      );
    }
    if (!slotInAvailability(tutor.availability, date, time)) {
      return NextResponse.json({ error: "That time is not available" }, { status: 400 });
    }
    for (const slot of tutor.bookedSlots || []) {
      if (slot?.date === date && slot?.time === time) {
        return NextResponse.json(
          { error: "That time was just taken — pick another slot" },
          { status: 409 },
        );
      }
    }

    const session = createSession({
      userId: user.id,
      tutorId,
      tutorName: tutor.name,
      tutorImage: tutor.image ?? null,
      tutorSubjects: tutor.subjects || [],
      club,
      subject,
      topic,
      grade,
      date,
      time,
      durationMin,
      notes: String(body.notes ?? "").trim() || null,
    });

    try {
      await db.collection("sessions").insertOne(session);
    } catch (e: any) {
      if (e?.code === 11000) {
        return NextResponse.json(
          { error: "That time was just taken — pick another slot" },
          { status: 409 },
        );
      }
      throw e;
    }

    return NextResponse.json({ data: session }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to book session" }, { status: 500 });
  }
}

/** List the signed-in user's sessions across all statuses, nearest first. */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    await ensureSessionIndexes();

    const sessions = await db
      .collection("sessions")
      .find({ userId: user.id })
      .sort({ date: 1, time: 1 })
      .limit(200)
      .toArray();

    return NextResponse.json({ data: sessions });
  } catch {
    return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
  }
}