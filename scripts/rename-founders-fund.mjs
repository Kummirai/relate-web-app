/**
 * One-shot migration: renames the report income line "sponsorships" to
 * "foundersFund" in financial_reports so income sources read Founders' Fund.
 *
 * Idempotent: documents without income.sponsorships are left untouched, and a
 * foundersFund value already present wins. Run with --dry-run to preview.
 *
 *   node --env-file=.env.local scripts/rename-founders-fund.mjs --dry-run
 *   node --env-file=.env.local scripts/rename-founders-fund.mjs
 */
import { MongoClient, ServerApiVersion } from "mongodb";
import dns from "node:dns";

// Some home routers can't resolve MongoDB's SRV records — query a public
// resolver instead (no-op when the local resolver already works).
dns.setServers(["1.1.1.1", "8.8.8.8", ...(dns.getServers?.() || [])]);

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "test";
const dryRun = process.argv.includes("--dry-run");

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
  const reports = db.collection("financial_reports");

  const pending = await reports
    .find({ "income.sponsorships": { $exists: true } })
    .project({ period: 1, "income.sponsorships": 1, "income.foundersFund": 1 })
    .toArray();
  console.log(`Found ${pending.length} report(s) still using income.sponsorships.`);
  for (const doc of pending) {
    console.log(
      `  ${doc._id} ${doc.period || "(no period)"}: sponsorships=${doc.income?.sponsorships} ` +
        `foundersFund=${doc.income?.foundersFund ?? "(none)"}`,
    );
  }
  if (dryRun) {
    console.log("\nDRY RUN — nothing written.");
    return;
  }

  const result = await reports.updateMany(
    { "income.sponsorships": { $exists: true } },
    [
      {
        $set: {
          "income.foundersFund": {
            $ifNull: ["$income.foundersFund", "$income.sponsorships"],
          },
        },
      },
      { $unset: "income.sponsorships" },
    ],
  );

  console.log(`\nDone. matched=${result.matchedCount} modified=${result.modifiedCount}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.close());
