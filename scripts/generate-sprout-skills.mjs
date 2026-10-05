/**
 * Adds the Sprout clubs to skills-import.json from the honors catalogue.
 *
 * Idempotent: any club whose slug starts with "sprout" is rebuilt from
 * honors-import.json, adult clubs are left untouched, and ordering stays
 * adults first, then Sprout, then the age bands.
 *
 *   node scripts/generate-sprout-skills.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSproutClubs } from "./lib/sprout-skills.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "skills-import.json");

const doc = JSON.parse(readFileSync(OUT, "utf8"));
const adults = doc.clubs.filter((club) => !club.slug.startsWith("sprout"));
const sprout = buildSproutClubs();

doc.clubs = [...adults, ...sprout];
writeFileSync(OUT, JSON.stringify(doc, null, 2));

for (const club of sprout) {
  console.log(`  ${club.slug}: ${club.skills.length} skills`);
}
console.log(`Wrote ${OUT} (${doc.clubs.length} clubs)`);
