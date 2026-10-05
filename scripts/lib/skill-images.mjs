import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const IMAGES = path.join(path.dirname(HERE), "skill-images.json");

/**
 * Stamps each skill with its photo (skill id -> absolute relateworld.org URL).
 * The mapping is generated from the downloaded files in
 * web_app/public/images/skills — see web_app/scripts/fetch-skill-images.mjs.
 */
export function applySkillImages(clubs) {
  if (!existsSync(IMAGES)) return clubs;
  const images = JSON.parse(readFileSync(IMAGES, "utf8"));
  for (const club of clubs) {
    for (const skill of club.skills) {
      const url = images[skill.id];
      if (url) skill.image = url;
      else delete skill.image;
    }
  }
  return clubs;
}
