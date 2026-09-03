import { NextResponse } from "next/server";

// VOTD uses the YouVersion Platform "verse of the day" API as the single
// authoritative source — both for which passage is shown each day AND for the
// verse text. This never drifts the way a locally-seeded index list can.
//
// The app's four legacy version labels (KJV/ASV/WEB/NET) map onto whatever
// English bibles this app key is licensed to fetch. KJV and NET are not
// licensed under the current key, so they fall back to ASV (id 12), a
// public-domain classic close to the KJV. ASV/WEB (id 206) are used directly.
//
// VOTD only changes once per day, so cache aggressively (24 hours).
const votdCache = new Map<string, { data: unknown; ts: number }>();
const VOTD_TTL = 24 * 60 * 60 * 1000;

const YVP_BASE = "https://api.youversion.com/v1";

// App version label -> YouVersion Bible id. Only ASV/WEB are offered so far;
// everything else (KJV, NET, …) falls back to ASV.
const VERSION_TO_BIBLE_ID: Record<string, number> = {
  ASV: 12,
  WEB: 206,
};
const FALLBACK_BIBLE_ID = 12; // ASV

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

const BOOK_NUM_TO_NAME: Record<number, string> = {
  1: "Genesis", 2: "Exodus", 3: "Leviticus", 4: "Numbers", 5: "Deuteronomy",
  6: "Joshua", 7: "Judges", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
  11: "1 Kings", 12: "2 Kings", 13: "1 Chronicles", 14: "2 Chronicles",
  15: "Ezra", 16: "Nehemiah", 17: "Esther", 18: "Job", 19: "Psalms",
  20: "Proverbs", 21: "Ecclesiastes", 22: "Song of Solomon", 23: "Isaiah",
  24: "Jeremiah", 25: "Lamentations", 26: "Ezekiel", 27: "Daniel",
  28: "Hosea", 29: "Joel", 30: "Amos", 31: "Obadiah", 32: "Jonah",
  33: "Micah", 34: "Nahum", 35: "Habakkuk", 36: "Zephaniah", 37: "Haggai",
  38: "Zechariah", 39: "Malachi", 40: "Matthew", 41: "Mark", 42: "Luke",
  43: "John", 44: "Acts", 45: "Romans", 46: "1 Corinthians",
  47: "2 Corinthians", 48: "Galatians", 49: "Ephesians", 50: "Philippians",
  51: "Colossians", 52: "1 Thessalonians", 53: "2 Thessalonians",
  54: "1 Timothy", 55: "2 Timothy", 56: "Titus", 57: "Philemon",
  58: "Hebrews", 59: "James", 60: "1 Peter", 61: "2 Peter", 62: "1 John",
  63: "2 John", 64: "3 John", 65: "Jude", 66: "Revelation",
};

function getYvpKey(): string | null {
  return process.env.YVP_APP_KEY || process.env.EXPO_PUBLIC_YVP_APP_KEY || null;
}

async function fetchYvp<T>(path: string): Promise<T | null> {
  const key = getYvpKey();
  if (!key) return null;
  try {
    const res = await fetch(`${YVP_BASE}${path}`, {
      headers: { "x-yvp-app-key": key, accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Passage text is always fetched from a YouVersion bible — never reconstructed
// from its passage id — so multi-verse ranges (e.g. "ISA.43.18-19") return the
// full text and the exact human reference including the range.
async function fetchPassage(
  bibleId: number,
  passageId: string,
): Promise<{ content: string; reference: string } | null> {
  const yvp = await fetchYvp<{ content: string; reference: string }>(
    `/bibles/${bibleId}/passages/${passageId}?format=text`,
  );
  if (!yvp?.content) return null;
  // Create the reference ourselves (YouVersion omits an explicit range suffix
  // on some verses). Derived from the passage id so it stays exact.
  return { content: yvp.content, reference: yvp.reference || passageId };
}

function resolveBibleId(version: string): number {
  const normalized = version.toUpperCase();
  return VERSION_TO_BIBLE_ID[normalized] ?? FALLBACK_BIBLE_ID;
}

function resolveVersionLabel(bibleId: number): string {
  for (const [label, id] of Object.entries(VERSION_TO_BIBLE_ID)) {
    if (id === bibleId) return label;
  }
  return "ASV";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dayParam = searchParams.get("day");
    const requestedVersion = (searchParams.get("version") || "KJV").toUpperCase();
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = dayParam ? parseInt(dayParam, 10) : Math.floor(diff / 86400000);

    const cacheKey = `${dayOfYear}:${requestedVersion}`;
    const cached = votdCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < VOTD_TTL) {
      return NextResponse.json(cached.data, {
        headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
      });
    }

    // 1. Authoritative day -> passage mapping from YouVersion.
    const votd = await fetchYvp<{ day: number; passage_id: string }>(
      `/verse_of_the_days/${dayOfYear}`,
    );
    if (!votd?.passage_id) {
      return NextResponse.json({ error: "could not fetch verse of the day" }, { status: 502 });
    }

    const passageId = votd.passage_id.toUpperCase();
    const parts = passageId.split(".");
    const usfm = parts[0];
    const chapter = parseInt(parts[1], 10);
    const verseRange =
      parts[2] && parts[2].includes("-")
        ? parts[2]
        : parseInt(parts[2], 10).toString();
    const book = USFM_TO_BOOK[usfm];
    const firstVerse = parseInt(parts[2] && parts[2].split("-")[0], 10);
    if (!book || isNaN(chapter) || isNaN(firstVerse)) {
      return NextResponse.json({ error: "invalid passage from YouVersion" }, { status: 502 });
    }

    // 2. Resolve the verse text for the requested version from YouVersion.
    const bibleId = resolveBibleId(requestedVersion);
    const passage = await fetchPassage(bibleId, `${usfm}.${chapter}.${verseRange}`);
    if (!passage) {
      return NextResponse.json({ error: "verse text not found" }, { status: 404 });
    }

    const versionLabel = resolveVersionLabel(bibleId);
    const book_name = BOOK_NUM_TO_NAME[book] || "";
    const data = {
      reference: passage.reference && passage.reference !== passageId
        ? passage.reference
        : `${book_name} ${chapter}:${verseRange}`,
      text: passage.content,
      version: versionLabel,
      book_name,
      book,
      chapter,
      verse: firstVerse,
      passage_id: passageId,
    };

    votdCache.set(cacheKey, { data, ts: Date.now() });

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
