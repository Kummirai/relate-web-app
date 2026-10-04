/**
 * Dumps the live `publications` collection to a backup JSON array.
 *
 * Safety net before retiring the bundled publication JSON files: prod holds
 * admin-authored issues that exist nowhere else (the repo seed only carries
 * the original catalog), so capture everything before any client-side copy
 * is deleted or a seeding run changes the collection.
 *
 * Run from the backend directory:
 *
 *   node --env-file=.env.local scripts/dump-publications.mjs
 *
 * Writes scripts/publications-prod-backup.json (committed). BSON dates are
 * emitted as {"$date": ...} so the file can be re-imported via Compass.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connect } from "./lib/mongo.mjs";

function bsonValue(value) {
  if (value instanceof Date) return { $date: value.toISOString() };
  if (Array.isArray(value)) return value.map(bsonValue);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = bsonValue(v);
    return out;
  }
  return value;
}

async function main() {
  const { db, close } = await connect();
  const docs = await db
    .collection("publications")
    .find({})
    .sort({ id: 1 })
    .toArray();

  const out = docs.map((doc) =>
    bsonValue(Object.fromEntries(Object.entries(doc).filter(([k]) => k !== "_id"))),
  );

  const outPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "publications-prod-backup.json",
  );
  writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Dumped ${out.length} publication(s) -> ${path.basename(outPath)}`);

  const byClub = {};
  for (const p of out) byClub[p.clubSlug ?? "?"] = (byClub[p.clubSlug ?? "?"] ?? 0) + 1;
  console.log("by club:", JSON.stringify(byClub));

  await close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
