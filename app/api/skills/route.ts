import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSkillsFramework } from "@/lib/skills";
import {
  publicError,
  publicJson,
  publicNotFound,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`skills:${clientIp(request)}`);
    if (!rl.ok) return publicTooMany();

    const db = await getDb();
    const framework = await getSkillsFramework(db);
    if (!framework || !framework.clubs || framework.clubs.length === 0) {
      return publicNotFound("Skills framework not published yet");
    }

    const clubSlug = request.nextUrl.searchParams.get("club");
    const data = clubSlug
      ? { clubs: framework.clubs.filter((c) => c.slug === clubSlug) }
      : framework;

    return publicJson(data, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error("GET /api/skills failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
