import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dayParam = searchParams.get("day");
    const versionParam = (searchParams.get("version") || "KJV").toUpperCase();
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = dayParam ? parseInt(dayParam, 10) : Math.floor(diff / 86400000);

    const db = await getDb();
    const col = db.collection("votd_verses");
    const count = await col.countDocuments();
    if (count === 0) {
      return NextResponse.json({ error: "votd_verses collection is empty. Run POST /api/bible/kjv/votd/seed first." }, { status: 404 });
    }

    const dayIndex = dayOfYear % count;
    const entry = await col.findOne({ dayIndex });
    if (!entry) {
      return NextResponse.json({ error: "verse not found" }, { status: 404 });
    }

    let version = versionParam;
    let bibleDoc = await db.collection("bible_versions").findOne(
      { version, "verses.book": entry.book, "verses.chapter": entry.chapter, "verses.verse": entry.verse },
      { projection: { verses: { $elemMatch: { book: entry.book, chapter: entry.chapter, verse: entry.verse } } } },
    );
    if (!bibleDoc?.verses?.[0] && version !== "KJV") {
      version = "KJV";
      bibleDoc = await db.collection("bible_versions").findOne(
        { version, "verses.book": entry.book, "verses.chapter": entry.chapter, "verses.verse": entry.verse },
        { projection: { verses: { $elemMatch: { book: entry.book, chapter: entry.chapter, verse: entry.verse } } } },
      );
    }

    const v = bibleDoc?.verses?.[0];
    if (!v) {
      return NextResponse.json({ error: "verse text not found in bible_versions collection" }, { status: 404 });
    }

    return NextResponse.json({
      reference: `${v.book_name} ${v.chapter}:${v.verse}`,
      text: v.text,
      theme: entry.theme,
      version,
      book_name: v.book_name,
      book: entry.book,
      chapter: entry.chapter,
      verse: entry.verse,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
