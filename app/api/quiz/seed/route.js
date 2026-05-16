import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { seedLeaderboard } from "@/lib/quiz";

const TEAMS = [
  "Faithful Warriors", "Bible Explorers", "Wisdom Seekers",
  "Grace Guardians", "Truth Hunters", "Light Bearers",
  "Courage Crew", "Hope Heroes", "Victory Vipers",
  "Destiny Defenders", "Kingdom Kids", "Scripture Stars",
];

const SESSIONS = [
  { session: 1, date: "August 8, 2026", books: "Jonah 1\u20132", season: 1 },
  { session: 2, date: "August 15, 2026", books: "Jonah 3\u20134", season: 1 },
  { session: 3, date: "August 22, 2026", books: "Ephesians 1\u20132", season: 1 },
  { session: 4, date: "August 29, 2026", books: "Ephesians 3\u20134", season: 1 },
  { session: 5, date: "September 5, 2026", books: "Ephesians 5\u20136", season: 1 },
  { session: 6, date: "September 12, 2026", books: "Season 1 Finale", season: 1 },
  { session: 7, date: "October 3, 2026", books: "Esther 1\u20135", season: 2 },
  { session: 8, date: "October 10, 2026", books: "Esther 6\u201310", season: 2 },
  { session: 9, date: "October 17, 2026", books: "Philemon 1", season: 2 },
  { session: 10, date: "October 24, 2026", books: "Review Week", season: 2 },
  { session: 11, date: "October 31, 2026", books: "Playoffs", season: 2 },
  { session: 12, date: "November 7, 2026", books: "Grand Finale", season: 2 },
];

const CHAMPIONS = [
  { team: "Faithful Warriors", members: ["Thando M.", "Liam K.", "Nomsa D."], season: "1", year: "2026", img: "https://images.unsplash.com/photo-1560252829-804f1aedf1be?q=80&w=600&h=400&auto=format&fit=crop" },
  { team: "Bible Explorers", members: ["Sarah K.", "David O.", "Grace N."], season: "1", year: "2026", img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&h=400&auto=format&fit=crop" },
  { team: "Wisdom Seekers", members: ["Michael A.", "Emma W.", "Joshua T."], season: "2", year: "2026", img: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=600&h=400&auto=format&fit=crop" },
];

export async function POST() {
  try {
    const db = await getDb();

    await db.collection("quiz_sessions").deleteMany({});
    await db.collection("quiz_sessions").insertMany(SESSIONS);

    await db.collection("quiz_champions").deleteMany({});
    await db.collection("quiz_champions").insertMany(CHAMPIONS);

    const existingTeams = await db.collection("quiz_teams").countDocuments();
    if (existingTeams === 0) {
      await db.collection("quiz_teams").insertMany(
        TEAMS.map((name) => ({ name })),
      );
    }

    const leaderboard = await seedLeaderboard();

    return NextResponse.json({
      success: true,
      sessions: SESSIONS.length,
      champions: CHAMPIONS.length,
      teams: TEAMS.length,
      leaderboard: leaderboard.length,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
