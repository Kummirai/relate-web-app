import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const book = searchParams.get("book");
    const chapter = searchParams.get("chapter");
    const translation = searchParams.get("translation");

    if (!book || !chapter || !translation) {
      return NextResponse.json(
        { error: "book, chapter and translation are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const doc = await db.collection("bible_versions").findOne({
      version: translation.toUpperCase(),
    });

    if (!doc?.verses) {
      return NextResponse.json(
        { error: `translation "${translation}" not found` },
        { status: 404 },
      );
    }

    const chapterNum = parseInt(chapter, 10);
    const matches = doc.verses.filter(
      (v: any) => v.book_name === book && v.chapter === chapterNum,
    );

    if (!matches.length) {
      return NextResponse.json({ error: "chapter not found" }, { status: 404 });
    }

    const verses = matches
      .sort((a: any, b: any) => a.verse - b.verse)
      .map((v: any) => ({ number: v.verse, content: v.text }));

    return NextResponse.json(
      { chapters: [{ verses }] },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}