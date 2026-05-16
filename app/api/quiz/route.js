import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();

    const sessions = await db.collection("quiz_sessions").find({}).sort({ session: 1 }).toArray();
    const champions = await db.collection("quiz_champions").find({}).toArray();
    const teams = await db.collection("quiz_teams").find({}).toArray();

    return NextResponse.json({ sessions, champions, teams });
  } catch (error) {
    console.error("Failed to fetch quiz data:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz data" },
      { status: 500 },
    );
  }
}
