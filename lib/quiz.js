import { getDb } from "./mongodb";

const REGISTRATIONS = "quiz_registrations";
const LEADERBOARD = "quiz_leaderboard";
const SESSIONS_COL = "quiz_sessions";
const BOOKS_COL = "quiz_books";

export function createRegistration(data) {
  return {
    teamName: data.teamName,
    name: data.name,
    phone: data.phone,
    member2: data.member2,
    member3: data.member3,
    createdAt: new Date(),
  };
}

export async function getRegistrations() {
  const db = await getDb();
  return db
    .collection(REGISTRATIONS)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
}

export async function insertRegistration(data) {
  const db = await getDb();
  const doc = createRegistration(data);
  const result = await db.collection(REGISTRATIONS).insertOne(doc);

  const existing = await db.collection(LEADERBOARD).findOne({ name: data.teamName });
  if (!existing) {
    await db.collection(LEADERBOARD).insertOne({ name: data.teamName, scores: [] });
  }

  return {
    _id: result.insertedId,
    ...doc,
    leaderboardEntry: { name: data.teamName, played: 0, scores: [], gpa: 0 },
  };
}

export async function getLeaderboard() {
  const db = await getDb();
  const teams = await db
    .collection(LEADERBOARD)
    .find({})
    .toArray();
  return teams
    .filter((t) => t.name && t.scores)
    .map((t) => ({
      name: t.name,
      played: t.scores.length,
      scores: t.scores,
      gpa: t.scores.length > 0
        ? t.scores.reduce((a, b) => a + b, 0) / t.scores.length
        : 0,
    }))
    .sort((a, b) => b.gpa - a.gpa || a.name.localeCompare(b.name));
}

export async function getSessions() {
  const db = await getDb();
  return db.collection(SESSIONS_COL).find({}).sort({ session: 1 }).toArray();
}

export async function getBooks() {
  const db = await getDb();
  return db.collection(BOOKS_COL).find({}).toArray();
}

export async function seedLeaderboard() {
  const db = await getDb();
  const teams = [
    { name: "Crown of Life", scores: [2, 2, 2, 2, 0, 2] },
    { name: "Armor Bearers", scores: [2, 0, 2, 2, 2, 2] },
    { name: "Kingdom Heirs", scores: [2, 0, 2, 0, 2, 2] },
    { name: "Morning Stars", scores: [0, 2, 2, 2, 0, 2] },
    { name: "Light Bearers", scores: [2, 0, 2, 0, 2, 0] },
    { name: "Peacemakers", scores: [0, 2, 0, 2, 0, 2] },
    { name: "Truth Bearers", scores: [2, 2, 0, 0, 2, 0] },
    { name: "Grace Guardians", scores: [0, 2, 0, 2, 0, 0] },
    { name: "Watchmen", scores: [2, 0, 0, 2, 0, 0] },
    { name: "Cornerstone", scores: [0, 0, 2, 0, 2, 0] },
    { name: "Chosen Vessels", scores: [0, 2, 0, 0, 0, 0] },
    { name: "Covenant Keepers", scores: [0, 0, 0, 2, 0, 0] },
  ];
  await db.collection(LEADERBOARD).deleteMany({});
  await db.collection(LEADERBOARD).insertMany(teams);
  return teams;
}

export async function seedSessions() {
  const db = await getDb();
  const sessions = [
    { session: 1, date: "August 8, 2026", books: "Jonah 1\u20132", season: 1 },
    { session: 2, date: "August 22, 2026", books: "Jonah 3\u20134", season: 1 },
    { session: 3, date: "September 5, 2026", books: "Ephesians 1\u20132", season: 1 },
    { session: 4, date: "September 19, 2026", books: "Ephesians 3\u20134", season: 1 },
    { session: 5, date: "October 3, 2026", books: "Ephesians 5\u20136", season: 1 },
    { session: 6, date: "October 17, 2026", books: "Review (Jonah & Ephesians)", season: 1 },
    { session: 7, date: "March 6, 2027", books: "Esther 1\u20132", season: 2 },
    { session: 8, date: "March 20, 2027", books: "Esther 3\u20134", season: 2 },
    { session: 9, date: "April 3, 2027", books: "Esther 5\u20137", season: 2 },
    { session: 10, date: "April 17, 2027", books: "Esther 8\u201310", season: 2 },
    { session: 11, date: "May 1, 2027", books: "Philemon 1", season: 2 },
    { session: 12, date: "May 15, 2027", books: "Review (Esther & Philemon)", season: 2 },
  ];
  await db.collection(SESSIONS_COL).deleteMany({});
  await db.collection(SESSIONS_COL).insertMany(sessions);
  return sessions;
}

export async function seedBooks() {
  const db = await getDb();
  const books = [
    { book: "Jonah", chapters: "1\u20134", season: "1", focus: "God's mercy to all nations, repentance, and the heart of a reluctant prophet" },
    { book: "Ephesians", chapters: "1\u20136", season: "1", focus: "Grace, salvation, unity in Christ, spiritual warfare, and walking in the Spirit" },
    { book: "Esther", chapters: "1\u201310", season: "2", focus: "God's providence, courage, faithfulness, and deliverance of His people" },
    { book: "Philemon", chapters: "1", season: "2", focus: "Forgiveness, reconciliation, and Christian brotherhood in action" },
  ];
  await db.collection(BOOKS_COL).deleteMany({});
  await db.collection(BOOKS_COL).insertMany(books);
  return books;
}
