import { getDb } from "./mongodb";

const REGISTRATIONS = "quiz_registrations";
const LEADERBOARD = "quiz_leaderboard";

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

export async function seedLeaderboard() {
  const db = await getDb();
  const teams = [
    { name: "Faithful Warriors", scores: [2, 2, 2, 2, 0, 2] },
    { name: "Scripture Seekers", scores: [2, 0, 2, 2, 2, 2] },
    { name: "Light of the Word", scores: [2, 0, 2, 0, 2, 2] },
    { name: "Bible Champions", scores: [0, 2, 2, 2, 0, 2] },
    { name: "Grace Defenders", scores: [2, 0, 2, 0, 2, 0] },
    { name: "Truth Bearers", scores: [0, 2, 0, 2, 0, 2] },
    { name: "Living Stones", scores: [2, 2, 0, 0, 2, 0] },
    { name: "Salt & Light", scores: [0, 2, 0, 2, 0, 0] },
    { name: "Bread of Life", scores: [2, 0, 0, 2, 0, 0] },
    { name: "New Creation", scores: [0, 0, 2, 0, 2, 0] },
    { name: "Mighty Vessels", scores: [0, 2, 0, 0, 0, 0] },
    { name: "Rising Disciples", scores: [0, 0, 0, 2, 0, 0] },
  ];
  await db.collection(LEADERBOARD).deleteMany({});
  await db.collection(LEADERBOARD).insertMany(teams);
  return teams;
}
