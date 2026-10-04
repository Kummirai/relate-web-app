import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { listAllClubs, type ClubDoc } from "@/lib/clubs";
import {
  publicError,
  publicJson,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";

/**
 * GET /api/clubs          Top-level clubs plus Sprout's age classes.
 * GET /api/clubs?all=1    Every club as one flat list (age classes included).
 *
 * Full club docs: identity, theme (color/icon/hero), mission/vision, pillar
 * labels, programs, WhatsApp link and registration form fields. This is the
 * single source of truth both apps render — nothing club-shaped is bundled.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`clubs:${clientIp(request)}`);
    if (!rl.ok) return publicTooMany();

    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "1";

    const db = await getDb();
    const clubs = await listAllClubs(db);

    if (all) {
      return publicJson({ clubs }, { headers: rateLimitHeaders(rl) });
    }

    const topLevel = clubs.filter((c: ClubDoc) => !c.parentSlug);
    const subClubs = clubs.filter((c: ClubDoc) => Boolean(c.parentSlug));
    return publicJson(
      { clubs: topLevel, subClubs },
      { headers: rateLimitHeaders(rl) },
    );
  } catch (error) {
    console.error("GET /api/clubs failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
