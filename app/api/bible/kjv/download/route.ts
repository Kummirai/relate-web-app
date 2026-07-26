import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const BOOK_TO_USFM: Record<number, string> = {
  1: "GEN", 2: "EXO", 3: "LEV", 4: "NUM", 5: "DEU", 6: "JOS", 7: "JDG", 8: "RUT",
  9: "1SA", 10: "2SA", 11: "1KI", 12: "2KI", 13: "1CH", 14: "2CH",
  15: "EZR", 16: "NEH", 17: "EST", 18: "JOB", 19: "PSA", 20: "PRO", 21: "ECC",
  22: "SON", 23: "ISA", 24: "JER", 25: "LAM", 26: "EZE", 27: "DAN", 28: "HOS",
  29: "JOE", 30: "AMO", 31: "OBA", 32: "JON", 33: "MIC", 34: "NAH", 35: "HAB",
  36: "ZEP", 37: "HAG", 38: "ZEC", 39: "MAL", 40: "MAT", 41: "MRK", 42: "LUK",
  43: "JHN", 44: "ACT", 45: "ROM", 46: "1CO", 47: "2CO", 48: "GAL", 49: "EPH",
  50: "PHI", 51: "COL", 52: "1TH", 53: "2TH", 54: "1TI", 55: "2TI",
  56: "TIT", 57: "PHM", 58: "HEB", 59: "JAS", 60: "1PE", 61: "2PE",
  62: "1JN", 63: "2JN", 64: "3JN", 65: "JUD", 66: "REV",
};

export async function GET() {
  try {
    const db = await getDb();
    const doc = await db.collection("bible").findOne({});
    if (!doc?.verses) {
      return NextResponse.json({ error: "no bible data" }, { status: 404 });
    }

    const grouped: Record<string, { v: number; t: string }[]> = {};
    for (const verse of doc.verses) {
      const usfm = BOOK_TO_USFM[verse.book];
      if (!usfm) continue;
      const key = `${usfm}.${verse.chapter}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ v: verse.verse, t: verse.text });
    }

    return NextResponse.json(grouped, {
      headers: {
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=2592000",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
