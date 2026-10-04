import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getHonorsFramework } from "@/lib/sprout-honors";
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
 * GET /api/sprout/honors
 * The Sprout honors framework — tracks, levels, badge requirements and shape
 * labels. Progress stays per-user on the existing honors routes; this is the
 * content both apps render. Seeded by scripts/seed-sprout-honors.mjs.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`sprout-honors:${clientIp(request)}`);
    if (!rl.ok) return publicTooMany();

    const db = await getDb();
    const framework = await getHonorsFramework(db);
    if (!framework || !Array.isArray(framework.levels) || framework.levels.length === 0) {
      return publicNotFound("Honors framework not published yet");
    }

    return publicJson(framework, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error("GET /api/sprout/honors failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
