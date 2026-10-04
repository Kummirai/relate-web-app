import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSportsConfig } from "@/lib/sports-teams";
import {
  publicError,
  publicJson,
  publicNotFound,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";

/**
 * GET /api/sports/teams
 * The whole sports catalog: teams, per-sport squads (players, coaches,
 * fixtures), position slots, squad sizes and max-per-position rules.
 * Seeded by scripts/seed-sports.mjs; empty DB → 404 so clients show an
 * empty state instead of rendering a half-built roster.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`sports-teams:${clientIp(request)}`);
    if (!rl.ok) return publicTooMany();

    const db = await getDb();
    const config = await getSportsConfig(db);
    if (!config || !Array.isArray(config.teams) || config.teams.length === 0) {
      return publicNotFound("No teams published yet");
    }

    return publicJson(config, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error("GET /api/sports/teams failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
