#!/usr/bin/env node
/**
 * Regenerate the mobile bundled fallback catalogue:
 *   mobile_app/src/constants/skills.ts  ←  scripts/skills-import.json
 *   (club colours from scripts/clubs-import.json)
 *
 * The API is the source of truth; this file only backs the app when the
 * skills endpoint is unreachable. Run it whenever the skills data changes:
 *
 *   node scripts/generate-mobile-skills.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const mobileFile = join(root, "..", "mobile_app", "src", "constants", "skills.ts");

const framework = JSON.parse(readFileSync(join(here, "skills-import.json"), "utf8"));
const clubsJson = JSON.parse(readFileSync(join(here, "clubs-import.json"), "utf8"));
const colorBySlug = new Map(
  (Array.isArray(clubsJson) ? clubsJson : clubsJson.clubs ?? []).map((c) => [
    c.slug,
    c,
  ]),
);

function quote(value) {
  return (
    '"' +
    value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t") +
    '"'
  );
}

/** JS value → TypeScript literal (2-space indent, trailing commas, bare keys). */
function serialize(value, depth) {
  const pad = "  ".repeat(depth);
  const padIn = "  ".repeat(depth + 1);
  if (value === null) return "null";
  if (typeof value === "string") return quote(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return (
      "[\n" +
      value.map((item) => `${padIn}${serialize(item, depth + 1)},\n`).join("") +
      pad +
      "]"
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return "{}";
    return (
      "{\n" +
      entries
        .map(([key, v]) => `${padIn}${key}: ${serialize(v, depth + 1)},\n`)
        .join("") +
      pad +
      "}"
    );
  }
  throw new Error(`Cannot serialize value of type ${typeof value}`);
}

const clubs = (framework.clubs ?? []).map((club) => {
  const colors = colorBySlug.get(club.slug) ?? {};
  return {
    clubSlug: club.slug,
    clubName: club.name,
    clubColor: colors.color ?? "#13c5dd",
    clubColorDark: colors.colorDark ?? "#0fa3c4",
    skills: (club.skills ?? []).map((skill) => {
      const firstLevel = skill.levels?.[0];
      return {
        id: skill.id,
        name: skill.name,
        clubSlug: club.slug,
        description: skill.description,
        icon: skill.icon,
        image: skill.image,
        type: skill.type,
        output: skill.output,
        detail: skill.detail,
        levelId: firstLevel?.id ?? "",
        requirements: firstLevel?.requirements ?? [],
        levels: (skill.levels ?? []).map((level) => ({
          id: level.id,
          name: level.name,
          levelNumber: level.levelNumber,
          color: level.color,
          colorDark: level.colorDark,
          description: level.description,
          requirements: level.requirements ?? [],
        })),
      };
    }),
  };
});

const file = `/**
 * Club Skills — the mobile copy of the skills framework.
 * Each club has an array of skills; each skill has levels (1-3).
 * The web app is the source of truth for artwork and live progress,
 * so keep this list in sync when a skill changes.
 *
 * GENERATED FILE — backend/scripts/generate-mobile-skills.mjs writes this
 * from backend/scripts/skills-import.json. Edit the data there and rerun the
 * script instead of editing below. The API stays the source of truth; this
 * copy only backs screens when /api/skills is unreachable.
 *
 * Types live in the catalog service (single source); this module re-exports
 * them and holds the bundled fallback rows.
 */

import type {
  Skill,
  SkillLevel,
  ClubSkills,
} from "@/services/skills-catalog";

export type {
  Skill,
  SkillLevel,
  SkillLevelId,
  SkillRequirement,
  SkillDetail,
  SkillProject,
  SkillProgress,
  ClubSkills,
} from "@/services/skills-catalog";

export const SKILLS_BY_CLUB: ClubSkills[] = ${serialize(clubs, 0)};

export function getClubSkills(clubSlug: string): ClubSkills | undefined {
  return SKILLS_BY_CLUB.find((c) => c.clubSlug === clubSlug);
}

export function getSkill(
  clubSlug: string,
  skillId: string,
): { skill: Skill; club: ClubSkills } | undefined {
  const club = getClubSkills(clubSlug);
  if (!club) return undefined;
  const skill = club.skills.find((s) => s.id === skillId);
  if (!skill) return undefined;
  return { skill, club };
}

export function getSkillLevel(
  skill: Skill,
  levelId: string,
): SkillLevel | undefined {
  return skill.levels.find((l) => l.id === levelId);
}

export function getSkillLevelByNumber(
  skill: Skill,
  levelNumber: number,
): SkillLevel | undefined {
  return skill.levels.find((l) => l.levelNumber === levelNumber);
}
`;

writeFileSync(mobileFile, file, "utf8");

const skillCount = clubs.reduce((sum, c) => sum + c.skills.length, 0);
console.log(
  `Wrote ${mobileFile}\n  ${clubs.length} clubs · ${skillCount} skills`,
);
