import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import {
  GENESIS_BEGINNINGS_QUESTIONS,
  GENESIS_ABRAHAM_QUESTIONS,
  type QuizQuestionContent,
} from "./quiz-content";

/**
 * Public Bible Quiz — the web-app club quiz.
 *
 * One shared season (the hub season: Genesis 1–25, running from 1 Jan 2027 to
 * the end of the season) played across the five hub clubs. Anyone can play:
 * no account required. A draw is stored per attempt so scoring is always
 * server-authoritative (the client never sees the answer keys).
 *
 * Later this same API feeds the mobile app.
 */

export const HUB_CLUBS = ["sprout", "surge", "pulse", "prime", "anchor"] as const;
export const HUB_SEASON = {
  book: "Genesis",
  bookLabel: "Genesis 1–25",
  startISO: "2027-01-01",
  endISO: "2027-02-28",
  seasonLabel: "Summer 2027",
};

// Genesis 1–11 (Beginnings) + 12–25 (Abraham) = the whole season window.
const HUB_BANK: QuizQuestionContent[] = [
  ...GENESIS_BEGINNINGS_QUESTIONS,
  ...GENESIS_ABRAHAM_QUESTIONS,
];

const HUB_BOOK_LABELS: Record<string, string> = {
  "Genesis: Beginnings": "Genesis 1–11",
  "Genesis: Abraham": "Genesis 12–25",
};

const ATTEMPTS_COL = "quiz_hub_attempts";
const QUESTION_COUNT = 10;
const SECONDS_PER_QUESTION = 30;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const BOARD_LIMIT = 5;
const LOGS_LIMIT = 50;

/** First Monday of the season — weekly rounds are anchored to it. */
const ROUND_ANCHOR = new Date(`${HUB_SEASON.startISO}T00:00:00.000Z`);
const SEASON_END = new Date(`${HUB_SEASON.endISO}T23:59:59.999Z`);

export type HubDrawQuestion = {
  id: string;
  book: string;
  bookLabel: string;
  chapter?: number;
  text: string;
  options: string[];
};

export type HubAttemptState = {
  attemptId: string;
  club: string;
  name: string;
  round: number;
  startedAt: Date;
  questions: (HubDrawQuestion & { correctIndex: number })[];
};

export type HubBoardRow = {
  rank: 1 | 2 | 3 | 4 | 5;
  playerId: string;
  name: string;
  club: string;
  score: number;
  correct: number;
  total: number;
  at: string;
};

export type HubBoardLog = {
  id: string;
  playerId: string;
  name: string;
  score: number;
  correct: number;
  total: number;
  milliseconds: number;
  at: string;
};

export type HubBoard = {
  round: number;
  roundLabel: string;
  open: boolean;
  rows: HubBoardRow[];
  logs: HubBoardLog[];
  totalAttempts: number;
};

export function cleanName(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40);
}

export function normalizeClub(value: unknown): string {
  const club = String(value ?? "").trim().toLowerCase();
  return (HUB_CLUBS as readonly string[]).includes(club) ? club : "";
}

export function roundFor(date: Date): number {
  if (date < ROUND_ANCHOR) return 0;
  const capped = date > SEASON_END ? SEASON_END : date;
  return Math.floor((capped.getTime() - ROUND_ANCHOR.getTime()) / WEEK_MS) + 1;
}

export function roundLabel(round: number): string {
  if (round <= 0) return "Season opens soon";
  return `Round ${round}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function slugify(book: string): string {
  return book.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function httpError(status: number, message: string) {
  const err: any = new Error(message);
  err.status = status;
  return err;
}

/** Draw a fresh shuffled question set — answers stay server-side. */
export function drawHubQuestions(count = QUESTION_COUNT): (HubDrawQuestion & { correctIndex: number })[] {
  return shuffle(HUB_BANK)
    .slice(0, count)
    .map((q, i) => {
      const options = shuffle(q.options);
      return {
        id: `${slugify(q.book)}-${i}`,
        book: q.book,
        bookLabel: HUB_BOOK_LABELS[q.book] ?? q.book,
        text: q.text,
        options,
        correctIndex: options.indexOf(q.options[q.correctIndex]),
      };
    });
}

/** Start a fresh attempt: persists the draw, returns the public question set. */
export async function startHubAttempt(inputs: {
  club: string;
  name: string;
  count?: number;
}): Promise<{ attemptId: string; club: string; name: string; season: typeof HUB_SEASON; secondsPerQuestion: number; questionCount: number; questions: HubDrawQuestion[] }> {
  const club = normalizeClub(inputs.club);
  if (!club) throw httpError(400, "Pick a club to play for.");
  const name = cleanName(inputs.name);
  if (!name) throw httpError(400, "Enter your name to play.");

  const count = Math.min(15, Math.max(5, Math.trunc(inputs.count ?? QUESTION_COUNT)));
  const questions = drawHubQuestions(count);

  const doc = {
    attemptId: null as string | null,
    club,
    name,
    round: roundFor(new Date()),
    questions,
    answers: null as (number | null)[] | null,
    correct: 0,
    total: questions.length,
    score: 0,
    durationMs: 0,
    startedAt: new Date(),
    completedAt: null as Date | null,
  };
  const db = await getDb();
  const inserted = await db.collection(ATTEMPTS_COL).insertOne(doc);

  return {
    attemptId: inserted.insertedId.toString(),
    club,
    name,
    season: HUB_SEASON,
    secondsPerQuestion: SECONDS_PER_QUESTION,
    questionCount: questions.length,
    questions: questions.map(({ id, book, bookLabel, text, options }) => ({ id, book, bookLabel, text, options })),
  };
}

/** Submit answers for a draw — scores server-side and returns the result. */
export async function submitHubAttempt(inputs: {
  attemptId: string;
  answers: { questionId: string; selected: number }[];
  durationMs?: number;
}): Promise<any> {
  const db = await getDb();
  const id = String(inputs.attemptId ?? "");
  const attempt = await db.collection(ATTEMPTS_COL).findOne({ _id: asObjectId(id) });
  if (!attempt) throw httpError(404, "Attempt not found — it may have expired.");
  if (attempt.completedAt) throw httpError(409, "This attempt was already submitted.");

  const chosen = new Map<string, number>();
  for (const a of inputs.answers ?? []) {
    const n = Number(a?.selected);
    if (Number.isInteger(n) && n >= 0 && n < 4) chosen.set(String(a?.questionId), n);
  }

  let correct = 0;
  attempt.questions.forEach((q: any) => {
    const pick = chosen.get(String(q.id));
    if (pick === q.correctIndex) correct += 1;
  });

  const completedAt = new Date();
  const durationMs =
    typeof inputs.durationMs === "number" && inputs.durationMs > 0
      ? Math.round(inputs.durationMs)
      : completedAt.getTime() - attempt.startedAt.getTime();
  const score = attempt.total > 0 ? Math.round((correct / attempt.total) * 100) : 0;
  const answers = attempt.questions.map((q: any) => chosen.get(String(q.id)) ?? null);

  await db.collection(ATTEMPTS_COL).updateOne(
    { _id: attempt._id },
    { $set: { answers, correct, score, durationMs, completedAt } },
  );

  return {
    attemptId: String(attempt._id),
    club: attempt.club,
    name: attempt.name,
    correct,
    total: attempt.total,
    score,
    durationMs,
    round: attempt.round,
    completedAt: completedAt.toISOString(),
  };
}

/** The round the boards show: the live round during/after the season, otherwise the most recent round with attempts (demo-friendly). */
export async function effectiveRound(db: any): Promise<number> {
  const live = roundFor(new Date());
  if (live > 0) return live;
  const last = await db
    .collection(ATTEMPTS_COL)
    .findOne({ completedAt: { $ne: null } }, { sort: { round: -1 }, projection: { round: 1 } });
  return last?.round ?? 0;
}

function bestPerPlayer(
  docs: any[],
): any[] {
  const best = new Map<string, any>();
  for (const a of docs) {
    const key = `${a.club}:${cleanName(a.name).toLowerCase()}`;
    const cur = best.get(key);
    if (
      !cur ||
      a.score > cur.score ||
      (a.score === cur.score && (a.durationMs < cur.durationMs || a.completedAt < cur.completedAt))
    ) {
      best.set(key, a);
    }
  }
  return [...best.values()].sort(
    (a, b) => b.score - a.score || a.durationMs - b.durationMs || a.completedAt - b.completedAt,
  );
}

export function toHubBoard(round: number, docs: any[], totalForRound: number, club: string): HubBoard {
  const ranked = bestPerPlayer(docs).slice(0, BOARD_LIMIT);
  const rows: HubBoardRow[] = ranked.map((a, i) => ({
    rank: (i + 1) as 1 | 2 | 3 | 4 | 5,
    playerId: `hub:${a.club}:${cleanName(a.name).toLowerCase()}`,
    name: a.name,
    club,
    score: a.score,
    correct: a.correct,
    total: a.total,
    at: a.completedAt ? new Date(a.completedAt).toISOString() : new Date().toISOString(),
  }));
  const sorted = [...docs].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );
  const logs: HubBoardLog[] = sorted.slice(0, LOGS_LIMIT).map((a) => ({
    id: String(a._id),
    playerId: `hub:${a.club}:${cleanName(a.name).toLowerCase()}`,
    name: a.name,
    score: a.score,
    correct: a.correct,
    total: a.total,
    milliseconds: a.durationMs ?? 0,
    at: new Date(a.completedAt).toISOString(),
  }));
  return {
    round,
    roundLabel: roundLabel(round),
    open: round >= 1,
    rows,
    logs,
    totalAttempts: totalForRound,
  };
}

/** Top-5 board + recent attempts for one club's current round. */
export async function hubBoardForClub(club: string): Promise<HubBoard> {
  const db = await getDb();
  const round = await effectiveRound(db);
  const filter = { club, round, completedAt: { $ne: null } };
  const docs = await db.collection(ATTEMPTS_COL).find(filter).toArray();
  const total = await db.collection(ATTEMPTS_COL).countDocuments(filter);
  return toHubBoard(round, docs, total, club);
}

/** Season-wide top-5 across all clubs. */
export async function hubOverview(): Promise<{
  season: typeof HUB_SEASON;
  round: number;
  roundLabel: string;
  rows: (HubBoardRow & { club: string })[];
  totalPlayers: number;
}> {
  const db = await getDb();
  const docs = await db
    .collection(ATTEMPTS_COL)
    .find({ completedAt: { $ne: null } })
    .toArray();
  const ranked = bestPerPlayer(docs).slice(0, BOARD_LIMIT);
  return {
    season: HUB_SEASON,
    round: await effectiveRound(db),
    roundLabel: roundLabel(roundFor(new Date())),
    rows: ranked.map((a, i) => ({
      rank: (i + 1) as 1 | 2 | 3 | 4 | 5,
      playerId: `hub:${a.club}:${cleanName(a.name).toLowerCase()}`,
      name: a.name,
      club: a.club,
      score: a.score,
      correct: a.correct,
      total: a.total,
      at: new Date(a.completedAt).toISOString(),
    })),
    totalPlayers: bestPerPlayer(docs).length,
  };
}

export function asObjectId(id: string) {
  return ObjectId.isValid(id) ? new ObjectId(id) : id;
}