/**
 * Seeds the publication catalog into the Mongo `publications` collection.
 * The source of truth for the bundled catalog is the JSON files under
 * scripts/publications-data.
 *
 * Existing publications are upserted by `id`; only `status`, `version`,
 * `publishedAt`, `source` and the timestamps are owned by this script, so a
 * later admin edit in Mongo won't be clobbered by re-running the seed.
 *
 * Admin-authored publications (anything this seed did not create, marked
 * `source: "seed"`) are never touched or pruned unless you pass `--prune`,
 * which removes seeded docs whose file no longer exists.
 *
 * Run from the backend directory:
 *
 *   node --env-file=.env.local scripts/seed-publications.mjs [--prune]
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connect } from "./lib/mongo.mjs";

const PUBLICATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "publications-data",
);

const PRUNE = process.argv.includes("--prune");

const MONTH_INDEX = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

/** "October 2026" doc -> the 1st of that month, for publish ordering. */
function publishedAt(pub) {
  const month = MONTH_INDEX[pub.month];
  if (month === undefined || !pub.year) return new Date();
  return new Date(Date.UTC(pub.year, month, 1));
}

async function main() {
  const files = readdirSync(PUBLICATIONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(path.join(PUBLICATIONS_DIR, f), "utf8")))
    .filter((pub) => pub && typeof pub.id === "string" && pub.id);

  const { db, close } = await connect();
  try {
    const collection = db.collection("publications");

    await collection.createIndex({ id: 1 }, { unique: true });
    await collection.createIndex({ publishedAt: -1 });

    for (const pub of files) {
      const now = new Date();
      await collection.updateOne(
        { id: pub.id },
        {
          $set: {
            ...pub,
            // Publishing metadata is owned by this script / the admin flow.
            status: "published",
            version: 1,
            publishedAt: publishedAt(pub),
            source: "seed",
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );
    }

    const finalCount = await collection.countDocuments({ status: "published" });
    console.log(`Seeded ${files.length} publication(s) → ${finalCount} published in Mongo.`);

    if (PRUNE) {
      // Only ever prunes docs this seed created (`source: "seed"`), so
      // admin-authored issues survive even with --prune.
      const fileIds = new Set(files.map((p) => p.id));
      const prune = await collection.deleteMany({
        source: "seed",
        id: { $nin: [...fileIds] },
      });
      if (prune.deletedCount > 0) {
        console.log(`Pruned ${prune.deletedCount} retired publication(s).`);
      }
    }
  } finally {
    await close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});