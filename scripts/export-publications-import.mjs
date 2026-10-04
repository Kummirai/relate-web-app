/**
 * Exports the bundled publication catalog as a single Compass-importable
 * JSON array. Compass can't run the upsert seed, so this produces the exact
 * documents the seed would: raw publication payload + publishing metadata
 * (status/version/publishedAt/createdAt/updatedAt), with dates in BSON
 * Extended JSON ({"$date": ...}) so they land in Mongo as real Dates.
 *
 * Run from the backend directory:
 *
 *   node scripts/export-publications-import.mjs
 *
 * Writes scripts/publications-import.json. Import it in Compass into the
 * `publications` collection (database from MONGODB_DB). The unique index on
 * `id` and the {publishedAt: -1} index are also created by the API on first
 * call; creating the unique one first makes re-imports fail loudly on dups
 * instead of silently stacking them.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PUBLICATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "publications-data",
);

const MONTH_INDEX = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

function publishedAt(pub) {
  const month = MONTH_INDEX[pub.month];
  if (month === undefined || !pub.year) return new Date().toISOString();
  return new Date(Date.UTC(pub.year, month, 1)).toISOString();
}

const now = new Date().toISOString();

const docs = readdirSync(PUBLICATIONS_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(path.join(PUBLICATIONS_DIR, f), "utf8")))
  .filter((pub) => pub && typeof pub.id === "string" && pub.id)
  .sort((a, b) => (a.id < b.id ? -1 : 1))
  .map((pub) => ({
    ...pub,
    status: "published",
    version: 1,
    publishedAt: { $date: publishedAt(pub) },
    createdAt: { $date: now },
    updatedAt: { $date: now },
  }));

const outPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "publications-import.json",
);
writeFileSync(outPath, JSON.stringify(docs, null, 2) + "\n", "utf8");
console.log(
  `Wrote ${docs.length} publication doc(s) → ${path.basename(outPath)}`,
);