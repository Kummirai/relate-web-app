import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSportsConfig } from "@/lib/sports-teams";
import { requireAdmin } from "@/lib/community-auth";

const fixtureKeys = ["date", "time", "competition", "opponent", "venue"] as const;

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = await getDb();
    const config = await getSportsConfig(db);
    const teams = Array.isArray(config?.teams) ? config!.teams : [];
    const squads = config?.squads && typeof config.squads === "object" ? config.squads : {};
    return NextResponse.json({ data: { teams, squads } });
  } catch {
    return NextResponse.json({ error: "Failed to load sports fixtures" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const teamId = typeof body?.teamId === "string" ? body.teamId.trim() : "";
    if (!teamId) return NextResponse.json({ error: "Team is required" }, { status: 400 });
    if (!Array.isArray(body?.fixtures)) {
      return NextResponse.json({ error: "Fixtures must be a list" }, { status: 400 });
    }

    const fixtures = body.fixtures.map((raw) => {
      const fixture = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      return {
        date: String(fixture.date ?? "").trim(),
        time: String(fixture.time ?? "").trim(),
        competition: String(fixture.competition ?? "").trim(),
        opponent: String(fixture.opponent ?? "").trim(),
        venue: String(fixture.venue ?? "").trim(),
        home: Boolean(fixture.home),
      };
    }).filter((fixture) => fixtureKeys.some((key) => fixture[key] !== ""));

    for (const fixture of fixtures) {
      if (!fixture.date || !fixture.time || !fixture.opponent) {
        return NextResponse.json({ error: "Each fixture needs a date, time and opponent" }, { status: 400 });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fixture.date)) {
        return NextResponse.json({ error: "Fixture dates must use YYYY-MM-DD" }, { status: 400 });
      }
    }

    const db = await getDb();
    const config = await getSportsConfig(db);
    if (!Array.isArray(config?.teams) || !config.teams.some((team: any) => team?.id === teamId)) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    fixtures.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
    await db.collection("sports_config").updateOne(
      { id: "default" },
      { $set: { [`squads.${teamId}.fixtures`]: fixtures, updatedAt: new Date() } },
    );
    return NextResponse.json({ success: true, data: fixtures });
  } catch {
    return NextResponse.json({ error: "Failed to save sports fixtures" }, { status: 500 });
  }
}
