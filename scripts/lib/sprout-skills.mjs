import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = path.dirname(HERE);
const HONORS = path.join(SCRIPTS, "honors-import.json");
const CLUBS = path.join(SCRIPTS, "clubs-import.json");

/** Ionicons names the honor crest art already uses, keyed by track. */
const TRACK_ICONS = {
  safety: "medkit",
  finance: "wallet",
  productivity: "laptop",
  code: "code-slash",
  media: "camera",
};

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

/** "Life Saver Badge" / "First Responder Honor" -> "Life Saver" / "First Responder". */
function skillName(badgeName) {
  return badgeName.replace(/\s+(Badge|Honor)$/, "");
}

function skillDescription(badge, track) {
  const blurb = track?.blurb ?? "";
  if (!badge.piggyBank) return blurb;
  const { weekly, weeks } = badge.piggyBank;
  return `${blurb} Saving target: R${weekly} a week for ${weeks} weeks (R${weekly * weeks}).`;
}

function toSkill(badge, band, track) {
  return {
    id: badge.id,
    name: skillName(badge.name),
    icon: TRACK_ICONS[badge.track] ?? "star",
    description: skillDescription(badge, track),
    levels: [
      {
        id: band.id,
        name: band.name,
        levelNumber: band.levelNumber,
        color: band.color,
        colorDark: band.colorDark,
        description: `${band.ageBand}. ${band.focus}`,
        requirements: badge.requirements,
      },
    ],
  };
}

/**
 * Sprout club entries for the skills framework, derived from the honors
 * catalogue: every honor badge becomes a skill, every honor level (age band)
 * becomes a skill level, and the parent Sprout club aggregates all three
 * bands so /sprout shows the full matrix.
 */
export function buildSproutClubs() {
  const honors = readJson(HONORS);
  const clubCatalog = readJson(CLUBS);
  const tracks = new Map((honors.tracks ?? []).map((t) => [t.id, t]));
  const findClub = (slug) => clubCatalog.clubs?.find?.((c) => c.slug === slug)
    ?? clubCatalog.find?.((c) => c.slug === slug);

  const bands = (honors.levels ?? []).map((band) => ({
    ...band,
    skills: band.badges.map((badge) => toSkill(badge, band, tracks.get(badge.track))),
  }));

  const ageClubs = bands.map((band) => {
    const catalog = findClub(band.clubSlug) ?? {};
    return {
      slug: band.clubSlug,
      name: catalog.name ?? band.name,
      ageRange: catalog.ageRange ?? band.ageBand.replace("Ages ", "").replace(/\s/g, ""),
      skills: band.skills,
    };
  });

  const parentCatalog = findClub("sprout") ?? {};
  const parent = {
    slug: "sprout",
    name: parentCatalog.name ?? "Sprout",
    ageRange: parentCatalog.ageRange ?? "6–15 yrs",
    skills: bands.flatMap((band) => band.skills),
  };

  return [parent, ...ageClubs];
}
