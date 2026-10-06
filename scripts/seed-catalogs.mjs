/**
 * Seeds the club catalog, store catalogue, sports catalog, skills framework,
 * Sprout honors framework and club program calendars into Mongo from the JSON
 * produced by scripts/make-imports.mjs (program-calendar-import.json is authored
 * from the yearly program docs).
 *
 * Usage (from the backend directory):
 *
 *   node --env-file=.env.local scripts/seed-catalogs.mjs            # everything
 *   node --env-file=.env.local scripts/seed-catalogs.mjs clubs store
 *
 * Targets: clubs | store | sports | skills | honors | calendar
 *
 * Semantics:
 *   - clubs / sports / skills / honors / calendar have no admin editor yet, so they are
 *     replaced wholesale on re-run (upsert by slug/id/clubSlug+year) — re-seeding picks
 *     up content changes from the JSON inputs.
 *   - calendar entries replaced this way reset admin-authored years too, so only
 *     re-run the calendar target when you intend to publish the shipped year.
 *   - store items only ever land with $setOnInsert: once an item exists, admin
 *     edits in Mongo win and re-seeding never clobbers them.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connect } from "./lib/mongo.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const readJson = (name) =>
  JSON.parse(readFileSync(path.join(HERE, name), "utf8"));

const TARGETS = {
  clubs: {
    collection: "clubs",
    file: "clubs-import.json",
    filter: (doc) => ({ slug: doc.slug }),
    index: { slug: 1 },
    mode: "replace",
  },
  store: {
    collection: "store_items",
    file: "store-import.json",
    filter: (doc) => ({ id: doc.id }),
    index: { id: 1 },
    mode: "insert-only",
  },
  sports: {
    collection: "sports_config",
    file: "sports-import.json",
    filter: () => ({ id: "default" }),
    index: { id: 1 },
    mode: "replace",
    wrap: (doc) => ({ id: "default", ...doc }),
  },
  skills: {
    collection: "skills",
    file: "skills-import.json",
    filter: () => ({ id: "framework" }),
    index: { id: 1 },
    mode: "replace",
    wrap: (doc) => ({ id: "framework", ...doc }),
  },
  honors: {
    collection: "sprout_honors",
    file: "honors-import.json",
    filter: () => ({ id: "framework" }),
    index: { id: 1 },
    mode: "replace",
    wrap: (doc) => ({ id: "framework", ...doc }),
  },
  calendar: {
    collection: "program_calendars",
    file: "program-calendar-import.json",
    filter: (doc) => ({ clubSlug: doc.clubSlug, year: doc.year }),
    index: { clubSlug: 1, year: 1 },
    mode: "replace",
  },
};

const requested = process.argv.slice(2).filter(Boolean);
const names = requested.length ? requested : Object.keys(TARGETS);

for (const name of names) {
  if (!TARGETS[name]) {
    console.error(`Unknown target "${name}". Use: ${Object.keys(TARGETS).join(" | ")}`);
    process.exit(1);
  }
}

async function seed(name, db, target) {
  const { collection, file, filter, index, mode, wrap } = target;
  const json = readJson(file);
  // clubs/store ship as arrays; sports/skills/honors are single config documents.
  const docs = Array.isArray(json) ? json : [json];
  const col = db.collection(collection);
  let inserted = 0;
  let skipped = 0;
  let updated = 0;

  await col.createIndex(index, { unique: true });

  for (const raw of docs) {
    const doc = wrap ? wrap(raw) : raw;
    const query = filter(doc);
    if (mode === "insert-only") {
      const res = await col.updateOne(
        query,
        { $setOnInsert: { ...doc, createdAt: new Date() } },
        { upsert: true },
      );
      if (res.upsertedCount) inserted += 1;
      else skipped += 1;
    } else {
      const res = await col.updateOne(
        query,
        {
          $set: { ...doc, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      );
      if (res.upsertedCount) inserted += 1;
      else updated += 1;
    }
  }

  console.log(
    `${name}: ${docs.length} docs -> ${collection} (inserted ${inserted}, updated ${updated}, kept ${skipped})`,
  );
}

async function main() {
  const { db, close } = await connect();
  try {
    for (const name of names) {
      await seed(name, db, TARGETS[name]);
    }
  } finally {
    await close();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
