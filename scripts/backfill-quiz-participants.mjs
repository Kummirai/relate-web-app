/**
 * One-shot backfill: turns existing Bible Quiz club registrations into quiz
 * players so members who joined before the registration→player bridge are
 * recognized. Mirrors backfillQuizParticipants() in lib/quiz-season.ts.
 *
 * Idempotent: players are deduped per club+name and only missing account
 * links are written. Run with --dry-run to preview without writing.
 *
 *   node --env-file=.env.local scripts/backfill-quiz-participants.mjs --dry-run
 *   node --env-file=.env.local scripts/backfill-quiz-participants.mjs
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

const SPROUT_CLUBS = ["sprout-kids", "sprout-tweens", "sprout-teens"];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hashColor(seed) {
  const AVATAR_COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#6366f1"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function main() {
  await client.connect();
  const db = client.db(dbName);

  const regs = await db
    .collection("club_registrations")
    .find({ clubSlug: { $in: SPROUT_CLUBS } })
    .toArray();
  console.log(`Found ${regs.length} Sprout club registration(s).`);

  let created = 0;
  let linked = 0;
  let skipped = 0;
  let alreadyDone = 0;

  for (const reg of regs) {
    const activity = String(reg.answers?.activity || "")
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
    if (activity !== "bible_quiz" && activity !== "quiz") {
      console.log(`  skip ${reg._id} (${reg.clubSlug}): activity="${reg.answers?.activity || ""}"`);
      skipped += 1;
      continue;
    }
    const childName = String(reg.answers?.childName || "").trim().slice(0, 60);
    if (!childName) {
      console.log(`  skip ${reg._id} (${reg.clubSlug}): no childName`);
      skipped += 1;
      continue;
    }

    const existing = await db.collection("quiz_participants").findOne({
      clubSlug: reg.clubSlug,
      name: { $regex: `^${escapeRegExp(childName)}$`, $options: "i" },
    });
    if (existing) {
      if (reg.userId && !existing.userId) {
        if (!dryRun) {
          await db
            .collection("quiz_participants")
            .updateOne({ _id: existing._id }, { $set: { userId: reg.userId } });
        }
        console.log(`  link ${reg.clubSlug} / "${childName}" -> user ${reg.userId}`);
        linked += 1;
      } else {
        console.log(`  ok   ${reg.clubSlug} / "${childName}" (player exists${existing.userId ? ", already linked" : ", no account to link"})`);
        alreadyDone += 1;
      }
      continue;
    }

    if (!dryRun) {
      await db.collection("quiz_participants").insertOne({
        participantId: `bp-${new Date().getTime()}-${Math.floor(Math.random() * 1e6)}`,
        userId: reg.userId ?? null,
        clubSlug: reg.clubSlug,
        name: childName,
        avatarColor: hashColor(childName),
        createdAt: new Date(),
      });
    }
    console.log(`  create ${reg.clubSlug} / "${childName}"${reg.userId ? ` (user ${reg.userId})` : " (no account)"}`);
    created += 1;
  }

  console.log(
    `\n${dryRun ? "DRY RUN — nothing written. " : "Done. "}` +
      `scanned=${regs.length} created=${created} linked=${linked} already-ok=${alreadyDone} skipped=${skipped}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.close());
