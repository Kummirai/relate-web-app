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

    // Match the stable string `id` (e.g. "t1"); also accept a Mongo `_id`
    // when the param happens to be a 24-char ObjectId hex.
    const query: Record<string, unknown>[] = [{ id }];
    if (ObjectId.isValid(id)) {
      query.push({ _id: new ObjectId(id) });
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