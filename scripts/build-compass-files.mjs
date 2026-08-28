import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_DIR =
  "C:/Users/Me/Downloads/truth_20260828_114438_634280/EN-English";

const VERSIONS = [
  { version: "KJV", file: "kjv.json", name: "King James Version" },
  { version: "ASV", file: "asv.json", name: "American Standard Version" },
  { version: "WEB", file: "web.json", name: "World English Bible" },
];

function main() {
  const dir = process.argv[2] || DEFAULT_DIR;
  const only = process.argv[3];
  for (const v of VERSIONS) {
    if (only && v.version !== only) continue;
    const data = JSON.parse(readFileSync(join(dir, v.file), "utf8"));
    if (!Array.isArray(data.verses) || data.verses.length === 0) {
      console.error(`${v.file}: no verses`);
      process.exit(1);
    }
    const meta = data.metadata || {};
    const doc = {
      version: v.version,
      name: meta.name || v.name,
      shortname: meta.shortname || v.version,
      year: meta.year || null,
      verses: data.verses,
    };
    const out = join(dir, `bible_versions_${v.version}.compass.json`);
    writeFileSync(out, JSON.stringify([doc]));
    console.log(`OK  ${out} — ${data.verses.length} verses`);
  }
}

main();