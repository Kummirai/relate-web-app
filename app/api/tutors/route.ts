import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ensureTutorIndexes } from "@/lib/tutors";

/** Tutor card fields — kept lean; the detail endpoint returns the rest. */
const LIST_PROJECTION = {
  id: 1,
  name: 1,
  image: 1,
  subjects: 1,
  gradeRanges: 1,
  clubs: 1,
  shortBio: 1,
  rating: 1,
  totalSessions: 1,
  responseTime: 1,
  verified: 1,
  active: 1,
};

function gradeInRange(grade: number, gradeRanges: string[]): boolean {
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

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    await ensureTutorIndexes();

    const { searchParams } = new URL(request.url);
    const club = searchParams.get("club");
    const subject = searchParams.get("subject")?.trim();
    const q = searchParams.get("q")?.trim();
    const rawGrade = Number(searchParams.get("grade"));

    const filter: Record<string, unknown> = { active: true };
    if (club === "sprout" || club === "surge") {
      filter.clubs = club;
    }
    if (subject) {
      filter.subjects = subject;
    }
    if (q) {
      const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      filter.$or = [{ name: rx }, { subjects: rx }];
    }

    const grade = Number.isInteger(rawGrade) && rawGrade >= 1 && rawGrade <= 12 ? rawGrade : null;

    let tutors = await db
      .collection("tutors")
      .find(filter)
      .project(LIST_PROJECTION)
      .sort({ rating: -1, totalSessions: -1 })
      .toArray();

    if (grade !== null) {
      tutors = tutors.filter((t) => gradeInRange(grade, t.gradeRanges || []));
    }

    return NextResponse.json({ data: tutors });
  } catch {
    return NextResponse.json({ error: "Failed to fetch tutors" }, { status: 500 });
  }
}