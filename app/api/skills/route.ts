import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSkillsFramework } from "@/lib/skills";
import { getClubDoc } from "@/lib/clubs";
import {
  publicError,
  publicJson,
  publicNotFound,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";

/** Club colours live in the clubs catalogue — the skills document only carries level colours. */
async function clubAccent(
  db: any,
  slug: string,
  fallback?: { color: string; colorDark: string },
): Promise<{ color: string; colorDark: string }> {
  try {
    const club = await getClubDoc(db, slug);
    if (club) return { color: club.color, colorDark: club.colorDark };
  } catch {
    // catalogue unreachable — fall back to the first level's colours
  }
  return {
    color: fallback?.color ?? "#13c5dd",
    colorDark: fallback?.colorDark ?? "#0fa3c4",
  };
}

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

    if (clubSlug) {
      const club = framework.clubs.find((c) => c.slug === clubSlug);
      if (!club) return publicNotFound("Club skills not found");

      const levelMap = new Map<
        string,
        {
          id: string;
          name: string;
          description?: string;
          color: string;
          colorDark: string;
          order: number;
        }
      >();
      const skills: {
        id: string;
        name: string;
        clubSlug: string;
        description: string;
        icon: string;
        levelId: string;
        requirements: { text: string; criteria: string[] }[];
        levels: {
          id: string;
          name: string;
          levelNumber: number;
          color: string;
          colorDark: string;
          description?: string;
          requirements: { text: string; criteria: string[] }[];
        }[];
      }[] = [];

      for (const skill of club.skills) {
        for (const level of skill.levels) {
          levelMap.set(level.id, {
            id: level.id,
            name: level.name,
            description: level.description,
            color: level.color,
            colorDark: level.colorDark,
            order: level.levelNumber,
          });
        }
        skills.push({
          id: skill.id,
          name: skill.name,
          clubSlug: club.slug,
          description: skill.description,
          icon: skill.icon,
          levelId: skill.levels[0]?.id ?? "",
          requirements: skill.levels[0]?.requirements ?? [],
          // Full per-level copy for clients that group requirements by level.
          levels: skill.levels.map((level) => ({
            id: level.id,
            name: level.name,
            levelNumber: level.levelNumber,
            color: level.color,
            colorDark: level.colorDark,
            description: level.description,
            requirements: level.requirements,
          })),
        });
      }

      const levels = Array.from(levelMap.values()).sort((a, b) => a.order - b.order);
      const clubColors = await clubAccent(db, club.slug, levels[0]);

      return publicJson(
        {
          club: {
            slug: club.slug,
            name: club.name,
            color: clubColors.color,
            colorDark: clubColors.colorDark,
          },
          // Flat aliases — the mobile catalog reads these instead of `club`.
          clubSlug: club.slug,
          clubName: club.name,
          clubColor: clubColors.color,
          clubColorDark: clubColors.colorDark,
          levels,
          skills,
          skillCount: skills.length,
        },
        { headers: rateLimitHeaders(rl) },
      );
    }

    return publicJson(framework, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error("GET /api/skills failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
