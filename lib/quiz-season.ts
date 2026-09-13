import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import {
  SEASONS_SEED,
  GENESIS_BEGINNINGS_QUESTIONS,
  GENESIS_ABRAHAM_QUESTIONS,
  GENESIS_ISAAC_JACOB_QUESTIONS,
  GENESIS_JOSEPH_QUESTIONS,
  type QuizWeekSeed,
  type SeasonSeed,
  type QuizQuestionContent,
} from "./quiz-content";

const SEASONS_COL = "quiz_seasons";
const QUESTIONS_COL = "quiz_questions";
const PARTICIPANTS_COL = "quiz_participants";
const ATTEMPTS_COL = "quiz_attempts";
const AWARDS_COL = "quiz_awards";

const CLUB_KEYS: Record<string, 1 | 2 | 3> = {
  "sprout-kids": 1,
  "sprout-tweens": 2,
  "sprout-teens": 3,
};

const TIER_KEY: Record<string, "kids" | "tweens" | "teens"> = {
  "sprout-kids": "kids",
  "sprout-tweens": "tweens",
  "sprout-teens": "teens",
};

export const AVATAR_COLORS = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

export function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type SeasonState = "upcoming" | "reading" | "quiz" | "closed";

export function seasonState(season: any, nowKey = todayKey()): SeasonState {
  if (nowKey < season.readStart) return "upcoming";
  if (nowKey <= season.readEnd) return "reading";
  if (nowKey <= season.endDate) return "quiz";
  return "closed";
}

export function weekOpen(week: QuizWeekSeed, nowKey = todayKey()): boolean {
  return nowKey >= week.openFrom && nowKey <= week.openUntil;
}

export function weekState(week: QuizWeekSeed, nowKey = todayKey()): "upcoming" | "open" | "closed" {
  if (nowKey < week.openFrom) return "upcoming";
  if (nowKey <= week.openUntil) return "open";
  return "closed";
}

export function baseSeconds(season: any, week: QuizWeekSeed): number {
  if (week.kind === "finale") return season.perQuestionSeconds?.finale ?? 20;
  if (week.kind === "bonus") return season.perQuestionSeconds?.bonus ?? 15;
  return season.perQuestionSeconds?.[TIER_KEY[season.clubSlug]] ?? 30;
}

export function maxAllowedLevel(clubSlug: string): 1 | 2 | 3 {
  return CLUB_KEYS[clubSlug] ?? 3;
}

/** Sprout age-class clubs — the only clubs whose members play the quiz. */
const SPROUT_CLUBS = ["sprout-kids", "sprout-tweens", "sprout-teens"];

/**
 * Only Sprout club members may join/play the quiz. A signed-in user counts as
 * a member when they have any club registration for a Sprout class (pending or
 * approved — parents register their children under their own account).
 */
export async function isSproutMember(db: any, userId: string): Promise<boolean> {
  if (!userId) return false;
  const reg = await db.collection("club_registrations").findOne(
    { userId, clubSlug: { $in: SPROUT_CLUBS } },
    { projection: { _id: 1 } },
  );
  return !!reg;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function getSeasonForClub(db: any, clubSlug: string, nowKey = todayKey()): Promise<any> {
  const seasons = await db
    .collection(SEASONS_COL)
    .find({ clubSlug })
    .sort({ endDate: -1 })
    .toArray();
  if (seasons.length === 0) return null;
  return (
    seasons.find((s: any) => nowKey <= s.endDate) ||
    seasons.find((s: any) => seasonState(s, nowKey) !== "closed") ||
    seasons[0]
  );
}

function booksForWeek(season: any, week: QuizWeekSeed): string[] {
  if (week.kind === "book" || week.kind === "finale") return [week.book];
  return (season.books ?? []).map((b: any) => b.book);
}

async function buildDraw(
  db: any,
  season: any,
  week: QuizWeekSeed,
  count: number,
): Promise<{ id: string; text: string; options: string[]; correctIndex: number }[]> {
  const all: any[] = await db
    .collection(QUESTIONS_COL)
    .find({ seasonKey: season.key, book: { $in: booksForWeek(season, week) } })
    .toArray();
  const cap = maxAllowedLevel(season.clubSlug);
  let pool = all.filter((q) => q.level <= cap);
  if (pool.length < count) {
    const rest = all
      .filter((q) => q.level > cap)
      .sort((a, b) => a.level - b.level);
    pool = [...pool, ...rest];
  }
  return shuffle(pool)
    .slice(0, count)
    .map((q) => {
      const options = shuffle(q.options as string[]);
      return {
        id: new ObjectId().toString(),
        text: q.text,
        options,
        correctIndex: options.indexOf(q.options[q.correctIndex]),
      };
    });
}

export type StartAttempt = {
  attemptId: string;
  quizName: string;
  book: string;
  kind: string;
  ordinal: number;
  secondsPerQuestion: number;
  questionCount: number;
  questions: { id: string; text: string; options: string[] }[];
};

export async function startAttempt(inputs: {
  participantId: string;
  clubSlug: string;
  ordinal: number;
  date?: string;
}): Promise<StartAttempt> {
  const db = await getDb();
  const nowKey = inputs.date || todayKey();
  const participant = await db.collection(PARTICIPANTS_COL).findOne({
    participantId: inputs.participantId,
  });
  if (!participant) {
    throw httpError(404, "Player not found. Open the quiz from your club card to register first.");
  }
  if (participant.clubSlug !== inputs.clubSlug) {
    throw httpError(400, "Player does not belong to this club.");
  }
  const season = await getSeasonForClub(db, inputs.clubSlug, nowKey);
  if (!season) throw httpError(404, "No quiz season for this club yet.");
  const state = seasonState(season, nowKey);
  if (state !== "quiz") {
    throw httpError(
      409,
      state === "upcoming"
        ? "The quiz opens when the season launches."
        : state === "reading"
          ? "Quiz questions open from week 6 — keep up with your reading weeks first."
          : "The season has ended.",
    );
  }
  const week = (season.quizWeeks as QuizWeekSeed[]).find(
    (w) => w.ordinal === Number(inputs.ordinal),
  );
  if (!week) throw httpError(404, "That quiz week does not exist.");
  if (!weekOpen(week, nowKey)) {
    throw httpError(
      409,
      weekState(week, nowKey) === "upcoming"
        ? `${week.name} opens on ${week.openFrom}.`
        : "That quiz has closed.",
    );
  }

  const count = week.kind === "finale" ? 15 : 10;
  const questions = await buildDraw(db, season, week, count);

  const doc = {
    participantId: inputs.participantId,
    clubSlug: inputs.clubSlug,
    seasonKey: season.key,
    ordinal: week.ordinal,
    quizName: week.name,
    book: week.book,
    kind: week.kind,
    questions,
    answers: Array<number | null>(questions.length).fill(null),
    correct: 0,
    total: questions.length,
    score: 0,
    durationMs: 0,
    startedAt: new Date(),
    completedAt: null,
    isBest: false,
  };
  const inserted = await db.collection(ATTEMPTS_COL).insertOne(doc);
  return {
    attemptId: inserted.insertedId.toString(),
    quizName: week.name,
    book: week.book,
    kind: week.kind,
    ordinal: week.ordinal,
    secondsPerQuestion: baseSeconds(season, week),
    questionCount: questions.length,
    questions: questions.map((q) => ({ id: q.id, text: q.text, options: q.options })),
  };
}

export async function submitAttempt(inputs: {
  attemptId: string;
  answers: (number | null)[];
  durationMs?: number;
}): Promise<any> {
  const db = await getDb();
  const attempt = await db.collection(ATTEMPTS_COL).findOne({
    _id: ObjectId.isValid(inputs.attemptId) ? new ObjectId(inputs.attemptId) : inputs.attemptId,
  });
  if (!attempt) throw httpError(404, "Attempt not found.");
  if (attempt.completedAt) throw httpError(409, "This attempt was already submitted.");

  const answers = (inputs.answers ?? []).map((a) =>
    typeof a === "number" && Number.isInteger(a) && a >= 0 && a < 4 ? a : null,
  );
  let correct = 0;
  attempt.questions.forEach((q: any, i: number) => {
    if (answers[i] === q.correctIndex) correct += 1;
  });

  const completedAt = new Date();
  const durationMs =
    inputs.durationMs ?? completedAt.getTime() - attempt.startedAt.getTime();
  const score = attempt.total > 0 ? Math.round((correct / attempt.total) * 100) : 0;

  await db.collection(ATTEMPTS_COL).updateOne(
    { _id: attempt._id },
    { $set: { answers, correct, score, durationMs, completedAt } },
  );

  const attempts = await db
    .collection(ATTEMPTS_COL)
    .find({
      participantId: attempt.participantId,
      ordinal: attempt.ordinal,
      completedAt: { $ne: null },
    })
    .sort({ score: -1, completedAt: 1 })
    .toArray();
  await db.collection(ATTEMPTS_COL).updateMany(
    { participantId: attempt.participantId, ordinal: attempt.ordinal },
    { $set: { isBest: false } },
  );
  if (attempts.length > 0) {
    const best = attempts[0];
    await db.collection(ATTEMPTS_COL).updateOne({ _id: best._id }, { $set: { isBest: true } });
  }

  const participant = await db.collection(PARTICIPANTS_COL).findOne({
    participantId: attempt.participantId,
  });
  const season = await getSeasonForClub(db, attempt.clubSlug);
  const badges = season ? await earnedBadges(db, attempt.participantId, season) : [];
  const rating = season ? await seasonRating(db, attempt.participantId, season) : 0;

  return {
    isBest: attempts[0]?._id.toString() === attempt._id.toString(),
    correct,
    total: attempt.total,
    score,
    participantId: attempt.participantId,
    participantName: participant?.name ?? "Player",
    clubSlug: attempt.clubSlug,
    seasonRating: rating,
    badges,
  };
}

export async function createParticipant(inputs: {
  name: string;
  clubSlug: string;
  userId?: string | null;
}): Promise<any> {
  const db = await getDb();
  const name = (inputs.name ?? "").trim().slice(0, 60);
  if (!name) throw httpError(400, "Enter the player's name to continue.");
  const existing = await db.collection(PARTICIPANTS_COL).findOne({
    clubSlug: inputs.clubSlug,
    name: { $regex: `^${escapeRegExp(name)}$`, $options: "i" },
  });
  if (existing) {
    if (inputs.userId && !existing.userId) {
      await db.collection(PARTICIPANTS_COL).updateOne(
        { _id: existing._id },
        { $set: { userId: inputs.userId } },
      );
    }
    return existing;
  }
  const doc = {
    participantId: new ObjectId().toString(),
    userId: inputs.userId ?? null,
    clubSlug: inputs.clubSlug,
    name,
    avatarColor: hashColor(name),
    createdAt: new Date(),
  };
  await db.collection(PARTICIPANTS_COL).insertOne(doc);
  return doc;
}

export async function findParticipants(db: any, clubSlug: string, q?: string): Promise<any[]> {
  const filter: any = { clubSlug };
  if (q) filter.name = { $regex: escapeRegExp(q.trim()), $options: "i" };
  return db.collection(PARTICIPANTS_COL).find(filter).sort({ createdAt: 1 }).limit(20).toArray();
}

export async function bestAttemptFor(
  db: any,
  participantId: string,
  ordinal: number,
): Promise<any | null> {
  return db.collection(ATTEMPTS_COL).findOne({
    participantId,
    ordinal,
    isBest: true,
    completedAt: { $ne: null },
  });
}

export async function leaderboardForWeek(
  db: any,
  season: any,
  week: QuizWeekSeed,
): Promise<any[]> {
  const attempts = await db
    .collection(ATTEMPTS_COL)
    .find({
      seasonKey: season.key,
      ordinal: week.ordinal,
      isBest: true,
      completedAt: { $ne: null },
    })
    .sort({ score: -1, completedAt: 1 })
    .toArray();
  const participantIds = [...new Set(attempts.map((a: any) => a.participantId))];
  const people: any[] = await db
    .collection(PARTICIPANTS_COL)
    .find({ participantId: { $in: participantIds } })
    .toArray();
  const byId = new Map(people.map((p: any) => [p.participantId, p]));
  return attempts
    .map((a: any, i: number) => ({
      rank: i + 1,
      participantId: a.participantId,
      name: byId.get(a.participantId)?.name ?? "Player",
      avatarColor: byId.get(a.participantId)?.avatarColor ?? "#94a3b8",
      image: byId.get(a.participantId)?.image ?? null,
      score: a.score,
      correct: a.correct,
      total: a.total,
      completedAt: a.completedAt,
    }))
    .filter((e: any) => !String(e.name).toLowerCase().includes("test"));
}

/** A leaderboard row in the shape the home rail and quiz hub expect. */
export type LogRow = {
  id: string;
  clubSlug: string;
  seasonLabel: string;
  quizName: string;
  book: string;
  kind: string;
  openFrom: string;
  ordinal: number;
  participants: { rank: number; participantId: string; name: string; avatarColor: string; image: string | null; score: number; correct: number; total: number }[];
};

/** Top-5 board for a single quiz week, wrapped in the rail's log shape. */
export async function buildLogForWeek(db: any, season: any, week: QuizWeekSeed): Promise<LogRow> {
  const board = await leaderboardForWeek(db, season, week);
  return {
    id: `${season.clubSlug}__${week.ordinal}`,
    clubSlug: season.clubSlug,
    seasonLabel: season.label,
    quizName: week.name,
    book: week.book,
    kind: week.kind,
    openFrom: week.openFrom,
    ordinal: week.ordinal,
    participants: board.slice(0, 5),
  };
}

export async function seasonRating(db: any, participantId: string, season: any): Promise<number> {
  const ranked = (season.quizWeeks as QuizWeekSeed[]).filter(
    (w) => w.kind === "book" || w.kind === "finale",
  );
  const scores: number[] = [];
  for (const w of ranked) {
    const best = await bestAttemptFor(db, participantId, w.ordinal);
    if (best) scores.push(best.score);
  }
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export async function booksCovered(db: any, participantId: string, season: any): Promise<string[]> {
  const ranked = (season.quizWeeks as QuizWeekSeed[]).filter((w) => w.kind === "book");
  const covered: string[] = [];
  for (const w of ranked) {
    const best = await bestAttemptFor(db, participantId, w.ordinal);
    if (best && best.score >= 50) covered.push(w.book);
  }
  return covered;
}

export const BADGES = [
  { key: "first-steps", label: "First Steps", icon: "footsteps-outline", description: "Complete your first Bible Quiz." },
  { key: "perfect-page", label: "Perfect Page", icon: "ribbon-outline", description: "Score 100% on any quiz." },
  { key: "bookworm-i", label: "Bookworm I", icon: "book-outline", description: "Score 50%+ on one book quiz." },
  { key: "bookworm-ii", label: "Bookworm II", icon: "book-outline", description: "Score 50%+ on two book quizzes." },
  { key: "bookworm-iii", label: "Bookworm III", icon: "book-outline", description: "Score 50%+ on all three book quizzes." },
  { key: "faithful", label: "Faithful", icon: "calendar-number-outline", description: "Play 4 different quizzes in one season." },
  { key: "finale-champ", label: "Finale Champion", icon: "trophy-outline", description: "Finish in the top 3 on the Season Finale." },
  { key: "podium-1", label: "Season Champion", icon: "medal-outline", description: "1st place in a season's awards." },
  { key: "podium-2", label: "Silver Sprout", icon: "medal-outline", description: "2nd place in a season's awards." },
  { key: "podium-3", label: "Bronze Sprout", icon: "medal-outline", description: "3rd place in a season's awards." },
] as const;

export async function earnedBadges(db: any, participantId: string, season: any): Promise<any[]> {
  const attempts = await db
    .collection(ATTEMPTS_COL)
    .find({ participantId, completedAt: { $ne: null } })
    .toArray();
  const bestByOrdinal = new Map<number, any>();
  for (const a of attempts) {
    const prev = bestByOrdinal.get(a.ordinal);
    if (
      !prev ||
      a.score > prev.score ||
      (a.score === prev.score && a.completedAt < prev.completedAt)
    ) {
      bestByOrdinal.set(a.ordinal, a);
    }
  }
  const bestList = [...bestByOrdinal.values()];

  const earned = new Set<string>();
  if (attempts.length > 0) earned.add("first-steps");
  if (bestList.some((a) => a.score >= 100)) earned.add("perfect-page");

  const bookWeeks = (season.quizWeeks as QuizWeekSeed[]).filter((w) => w.kind === "book");
  let covered = 0;
  for (const w of bookWeeks) {
    const best = bestList.find((a) => a.ordinal === w.ordinal);
    if (best && best.score >= 50) covered += 1;
  }
  if (covered >= 1) earned.add("bookworm-i");
  if (covered >= 2) earned.add("bookworm-ii");
  if (covered >= 3) earned.add("bookworm-iii");
  if (new Set(bestList.map((a) => a.ordinal)).size >= 4) earned.add("faithful");

  const finaleOrd = (season.quizWeeks as QuizWeekSeed[]).find((w) => w.kind === "finale")?.ordinal;
  if (finaleOrd !== undefined) {
    const finaleWeek = (season.quizWeeks as QuizWeekSeed[]).find((w) => w.ordinal === finaleOrd)!;
    const finalists = await leaderboardForWeek(db, season, finaleWeek);
    if (finalists.some((f: any) => f.participantId === participantId && f.rank <= 3)) {
      earned.add("finale-champ");
    }
  }

  const awards = await db
    .collection(AWARDS_COL)
    .find({ participantId, seasonKey: season.key })
    .toArray();
  for (const a of awards) {
    if (a.rank === 1) earned.add("podium-1");
    else if (a.rank === 2) earned.add("podium-2");
    else if (a.rank === 3) earned.add("podium-3");
  }

  return BADGES.filter((b) => earned.has(b.key)).map((b) => ({ ...b }));
}

export async function participantProfile(db: any, participantId: string): Promise<any> {
  const participant = await db.collection(PARTICIPANTS_COL).findOne({ participantId });
  if (!participant) throw httpError(404, "Participant not found.");
  const season = await getSeasonForClub(db, participant.clubSlug);
  if (!season) {
    return { participant, season: null, state: null, rating: 0, books: [], scores: [], badges: [], awards: [], placements: [] };
  }

  const weeks = (season.quizWeeks as QuizWeekSeed[]).filter(
    (w) => w.kind === "book" || w.kind === "finale",
  );
  const scores: any[] = [];
  for (const w of weeks) {
    const best = await bestAttemptFor(db, participantId, w.ordinal);
    if (!best) continue;
    const board = await leaderboardForWeek(db, season, w);
    const spot = board.find((e: any) => e.participantId === participantId);
    scores.push({
      ordinal: w.ordinal,
      quizName: w.name,
      book: w.book,
      score: best.score,
      correct: best.correct,
      total: best.total,
      completedAt: best.completedAt,
      rank: spot?.rank ?? null,
      totalParticipants: board.length,
    });
  }

  const awards = await db
    .collection(AWARDS_COL)
    .find({ participantId, seasonKey: season.key })
    .toArray();
  return {
    participant,
    season,
    state: seasonState(season),
    rating: await seasonRating(db, participantId, season),
    books: await booksCovered(db, participantId, season),
    scores,
    badges: await earnedBadges(db, participantId, season),
    awards,
    placements: scores
      .filter((s) => s.rank)
      .map((s) => ({ quizName: s.quizName, book: s.book, rank: s.rank, totalParticipants: s.totalParticipants })),
  };
}

export async function closeSeasons(db: any): Promise<any[]> {
  const seasons = await db.collection(SEASONS_COL).find({ awardsWritten: { $ne: true } }).toArray();
  const finalized: any[] = [];
  for (const season of seasons) {
    if (seasonState(season) !== "closed") continue;
    await finalizeSeason(db, season);
    finalized.push({ clubSlug: season.clubSlug, key: season.key });
  }
  return finalized;
}

export async function finalizeSeason(db: any, season: any): Promise<any> {
  const ranked = (season.quizWeeks as QuizWeekSeed[]).filter(
    (w) => w.kind === "book" || w.kind === "finale",
  );
  const rankedOrdinals = new Set(ranked.map((w) => w.ordinal));
  const attempts = await db
    .collection(ATTEMPTS_COL)
    .find({ seasonKey: season.key, completedAt: { $ne: null } })
    .toArray();

  const bestByParticipant = new Map<
    string,
    { scores: number[]; perfect: boolean }
  >();
  for (const a of attempts) {
    if (!rankedOrdinals.has(a.ordinal)) continue;
    const entry = bestByParticipant.get(a.participantId) ?? { scores: [], perfect: false };
    if (a.isBest || entry.scores.length === 0) {
      entry.scores.push(a.score);
      entry.perfect = entry.perfect || a.score >= 100;
    }
    bestByParticipant.set(a.participantId, entry);
  }

  if (bestByParticipant.size === 0) {
    await db.collection(SEASONS_COL).updateOne({ _id: season._id }, { $set: { awardsWritten: true } });
    return { awards: [] };
  }

  const people: any[] = await db
    .collection(PARTICIPANTS_COL)
    .find({ participantId: { $in: [...bestByParticipant.keys()] } })
    .toArray();
  const nameById = new Map(people.map((p: any) => [p.participantId, p.name]));

  const rows = [...bestByParticipant.entries()]
    .map(([participantId, e]) => ({
      participantId,
      name: nameById.get(participantId) ?? "Player",
      rating: Math.round(e.scores.reduce((a, b) => a + b, 0) / e.scores.length),
      perfect: e.perfect,
      played: e.scores.length,
    }))
    .sort((a, b) => b.rating - a.rating || b.played - a.played);

  const awards: any[] = [];
  rows.slice(0, 3).forEach((r, i) => {
    const rank = i + 1;
    awards.push({
      seasonKey: season.key,
      clubSlug: season.clubSlug,
      participantId: r.participantId,
      name: r.name,
      rank,
      prize: season.awards?.find((a: any) => a.rank === rank)?.prize ?? "Prize",
      claimed: false,
      createdAt: new Date(),
    });
  });

  const winners = new Set(awards.map((a) => a.participantId));
  for (const r of rows) {
    if (!r.perfect || winners.has(r.participantId)) continue;
    awards.push({
      seasonKey: season.key,
      clubSlug: season.clubSlug,
      participantId: r.participantId,
      name: r.name,
      rank: 0,
      prize: "Badge set + stickers",
      claimed: false,
      createdAt: new Date(),
    });
  }

  await db.collection(AWARDS_COL).deleteMany({ seasonKey: season.key, clubSlug: season.clubSlug });
  if (awards.length > 0) await db.collection(AWARDS_COL).insertMany(awards);
  await db.collection(SEASONS_COL).updateOne({ _id: season._id }, { $set: { awardsWritten: true } });
  return { awards };
}

export async function seedQuizSeason(): Promise<any> {
  const db = await getDb();
  await db.collection(SEASONS_COL).deleteMany({ key: { $in: ["SUMMER-2026"] } });
  await db.collection(AWARDS_COL).deleteMany({ seasonKey: "SUMMER-2026" });
  await db.collection(QUESTIONS_COL).deleteMany({ seasonKey: "SUMMER-2026" });
  await db.collection(ATTEMPTS_COL).deleteMany({ seasonKey: "SUMMER-2026" });
  await db.collection(PARTICIPANTS_COL).deleteMany({
    clubSlug: { $in: ["sprout-kids", "sprout-tweens", "sprout-teens"] },
  });

  const seasonDocs = SEASONS_SEED.map((s: SeasonSeed) => ({
    ...s,
    awardsWritten: false,
    createdAt: new Date(),
  }));
  await db.collection(SEASONS_COL).insertMany(seasonDocs);

  const bank: QuizQuestionContent[] = [
    ...GENESIS_BEGINNINGS_QUESTIONS,
    ...GENESIS_ABRAHAM_QUESTIONS,
    ...GENESIS_ISAAC_JACOB_QUESTIONS,
    ...GENESIS_JOSEPH_QUESTIONS,
  ];
  await db.collection(QUESTIONS_COL).insertMany(
    bank.map((q) => ({ seasonKey: "SUMMER-2026", ...q })),
  );

  return { seasonCount: seasonDocs.length, questionCount: bank.length };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function httpError(status: number, message: string) {
  const err: any = new Error(message);
  err.status = status;
  return err;
}