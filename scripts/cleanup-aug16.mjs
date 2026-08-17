/**
 * One-off cleanup: remove all sponsorship pledges created on 16 Aug 2026
 * (dummy test data). Run from the relate-web-app directory:
 *
 *   node --env-file=.env.local scripts/cleanup-aug16.mjs
 *
 * It deletes matching documents from the "sponsorships" collection and
 * reports how many were removed.
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
  const col = db.collection("sponsorships");

  // 16 Aug 2026 00:00:00 UTC  →  17 Aug 2026 00:00:00 UTC
  const from = new Date("2026-08-16T00:00:00.000Z");
  const to   = new Date("2026-08-17T00:00:00.000Z");

  const result = await col.deleteMany({
    createdAt: { $gte: from, $lt: to },
  });

  console.log(`Deleted ${result.deletedCount} sponsorship(s) from 16 Aug 2026.`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
