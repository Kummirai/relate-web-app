/**
 * Seeds the in-app publication catalog into the Mongo `publications` collection.
 * The source of truth for content is the JSON files under
 * frontend/src/data/publications — the same payload the app bundles.
 *
 * Existing publications are upserted by `id`; only `status`, `version`,
 * `publishedAt` and the timestamps are owned by this script, so a later
 * admin edit in Mongo won't be clobbered by re-running the seed.
 *
 * Run from the backend directory:
 *
 *   node --env-file=.env.local scripts/seed-publications.mjs
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "test";

if (!uri) {
  console.error("MONGODB_URI is not set. Aborting.");
  process.exit(1);
}

const PUBLICATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../frontend/src/data/publications",
);

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

const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function main() {
  const files = readdirSync(PUBLICATIONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(path.join(PUBLICATIONS_DIR, f), "utf8")))
    .filter((pub) => pub && typeof pub.id === "string" && pub.id);

  await client.connect();
  const db = client.db(dbName);
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
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
  }

  const count = await collection.countDocuments({ status: "published" });
  console.log(`Seeded ${files.length} publication(s) → ${count} published in Mongo.`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});