import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const doc = await db.collection("bible").findOne({});
    return NextResponse.json(doc ? { keys: Object.keys(doc), sample: doc } : { error: "empty collection" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
