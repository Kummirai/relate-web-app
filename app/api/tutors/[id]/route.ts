import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { ensureTutorIndexes } from "@/lib/tutors";

/** Detail view: email stays internal (never sent to the app). */
const DETAIL_PROJECTION = { email: 0 };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing tutor id" }, { status: 400 });
    }

    const db = await getDb();
    await ensureTutorIndexes();

    const query: Record<string, unknown>[] = [
      { id },
      { _id: new ObjectId(id) },
    ];
    // An id that is a valid ObjectId is matched as a Mongo `_id`; otherwise
    // only the string `id` (e.g. "t1") is consulted.
    if (!ObjectId.isValid(id)) {
      query.length = 1;
    }

    const tutor = await db
      .collection("tutors")
      .findOne({ $or: query, active: true }, { projection: DETAIL_PROJECTION });

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    return NextResponse.json({ data: tutor });
  } catch {
    return NextResponse.json({ error: "Failed to fetch tutor" }, { status: 500 });
  }
}