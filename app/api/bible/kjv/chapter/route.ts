import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const USFM_TO_BOOK: Record<string, number> = {
  GEN: 1, EXO: 2, LEV: 3, NUM: 4, DEU: 5, JOS: 6, JDG: 7, RUT: 8,
  "1SA": 9, "2SA": 10, "1KI": 11, "2KI": 12, "1CH": 13, "2CH": 14,
  EZR: 15, NEH: 16, EST: 17, JOB: 18, PSA: 19, PRO: 20, ECC: 21,
  SON: 22, ISA: 23, JER: 24, LAM: 25, EZE: 26, DAN: 27, HOS: 28,
  JOE: 29, AMO: 30, OBA: 31, JON: 32, MIC: 33, NAH: 34, HAB: 35,
  ZEP: 36, HAG: 37, ZEC: 38, MAL: 39, MAT: 40, MRK: 41, LUK: 42,
  JHN: 43, ACT: 44, ROM: 45, "1CO": 46, "2CO": 47, GAL: 48, EPH: 49,
  PHI: 50, COL: 51, "1TH": 52, "2TH": 53, "1TI": 54, "2TI": 55,
  TIT: 56, PHM: 57, HEB: 58, JAS: 59, "1PE": 60, "2PE": 61,
  "1JN": 62, "2JN": 63, "3JN": 64, JUD: 65, REV: 66,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const passageId = searchParams.get("passageId");
    if (!passageId) {
      return NextResponse.json({ error: "passageId required" }, { status: 400 });
    }

    const parts = passageId.toUpperCase().split(".");
    const usfm = parts[0];
    const chapter = parseInt(parts[1], 10);

    const bookNum = USFM_TO_BOOK[usfm];
    if (!bookNum || isNaN(chapter)) {
      return NextResponse.json({ error: "invalid passageId" }, { status: 400 });
    }

    const db = await getDb();
    const doc = await db.collection("bible").findOne(
      { "verses.book": bookNum, "verses.chapter": chapter },
      { projection: { verses: { $elemMatch: { book: bookNum, chapter: chapter } } } },
    );

    if (!doc?.verses?.length) {
      return NextResponse.json({ error: "chapter not found" }, { status: 404 });
    }

    const verses = doc.verses
      .sort((a: any, b: any) => a.verse - b.verse)
      .map((v: any) => ({ verse: v.verse, text: v.text }));

    const bookName = doc.verses[0].book_name;
    return NextResponse.json({
      reference: `${bookName} ${chapter}`,
      bookName,
      chapter,
      verses,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
