import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import VOTD_VERSES from "@/lib/votd-verses";

export async function POST() {
  try {
    const db = await getDb();
    const col = db.collection("votd_verses");

    await col.deleteMany({});
    const docs = VOTD_VERSES.map((v, i) => ({
      dayIndex: i,
      book: v.book,
      chapter: v.chapter,
      verse: v.verse,
      theme: v.theme,
    }));
    await col.insertMany(docs);
    await col.createIndex({ dayIndex: 1 }, { unique: true });

    return NextResponse.json({ ok: true, count: docs.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
