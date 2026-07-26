import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const count = await db.collection("bible").countDocuments();
    const sample = await db.collection("bible").find({}).limit(3).toArray();
    const fields = sample.length > 0 ? Object.keys(sample[0]) : [];
    return NextResponse.json({ count, fields, sample });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
