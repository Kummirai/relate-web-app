/**
 * One-shot repair: guarantees every club-scoped publication carries its club
 * tag (uppercase) in `tags`. Fixes magazines published before
 * normalizePublication started auto-adding the tag — e.g. a Prime magazine
 * that never showed under the Prime tab in the Library.
 *
 * Tags are uppercased and de-duplicated; the club tag (or "RELATE" for
 * unscoped publications) is prepended when missing.
 *
 * Run from the backend directory:
 *
 *   node --env-file=.env.local scripts/repair-publication-tags.mjs
 */
import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "test";

if (!uri) {
  console.error("MONGODB_URI is not set. Aborting.");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function main() {
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection("publications");

  const docs = await collection.find({}).toArray();
  let fixed = 0;

  for (const doc of docs) {
    const clubTag = (
      (typeof doc.clubSlug === "string" && doc.clubSlug) || "RELATE"
    ).toUpperCase();

    const tags: string[] = Array.isArray(doc.tags)
      ? doc.tags.filter((t: unknown): t is string => typeof t === "string")
      : [];
    const normalized = [...new Set(tags.map((t) => t.toUpperCase()))];
    if (!normalized.includes(clubTag)) normalized.unshift(clubTag);

    const before = JSON.stringify(tags);
    const after = JSON.stringify(normalized);
    if (before === after) continue;

    await collection.updateOne({ _id: doc._id }, { $set: { tags: normalized } });
    fixed += 1;
    console.log(`fixed ${doc.id}: ${before} -> ${after}`);
  }

  console.log(`Done. ${fixed} publication(s) updated.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.close());
