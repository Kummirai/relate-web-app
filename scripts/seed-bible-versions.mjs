import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { MongoClient } from "mongodb";

const DEFAULT_DIR =
  "C:/Users/Me/Downloads/truth_20260828_114438_634280/EN-English";

function loadEnv(file) {
  if (!readFileSync) return {};
  try {
    const raw = readFileSync(file, "utf8");
    const env = {};
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[m[1]] = val;
    }
    return env;
  } catch {
    return {};
  }
}

async function main() {
  const dir = process.argv[2] || DEFAULT_DIR;
  const env = loadEnv(resolve(process.cwd(), ".env.local"));
  const uri = env.MONGODB_URI || process.env.MONGODB_URI;
  const dbName = env.MONGODB_DB || process.env.MONGODB_DB || "test";

  if (!uri) {
    console.error("MONGODB_URI not found in .env.local or env");
    process.exit(1);
  }

  const versions = [
    { version: "KJV", file: "kjv.json", name: "King James Version" },
    { version: "ASV", file: "asv.json", name: "American Standard Version" },
    { version: "WEB", file: "web.json", name: "World English Bible" },
    { version: "NET", file: "net.json", name: "NET Bible" },
  ];

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection("bible_versions");
    await col.createIndex({ version: 1 }, { unique: true });

    for (const v of versions) {
      const path = join(dir, v.file);
      const data = JSON.parse(readFileSync(path, "utf8"));
      const verses = data.verses;
      if (!Array.isArray(verses) || verses.length === 0) {
        console.error(`${v.file}: no verses found`);
        process.exit(1);
      }
      const meta = data.metadata || {};
      await col.updateOne(
        { version: v.version },
        {
          $set: {
            version: v.version,
            name: meta.name || v.name,
            shortname: meta.shortname || v.version,
            year: meta.year || null,
            verses,
          },
        },
        { upsert: true },
      );
      console.log(
        `OK  ${v.version} (${v.name}) — ${verses.length} verses`,
      );
    }

    await col.createIndex({ "verses.book_name": 1, "verses.chapter": 1 });
    console.log("Done. bible_versions ready.");
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});