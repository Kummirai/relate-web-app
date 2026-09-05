import { getDb } from "./mongodb";

const KEY = { key: "discover" };

/**
 * Content version for the home "What's new" rail. Bumped on every
 * event/group/skill create, edit or delete so clients can compare their
 * stored snapshot version and skip refetching unchanged content.
 */
export async function getDiscoverVersion() {
  try {
    const db = await getDb();
    const doc = await db.collection("content_versions").findOne(KEY);
    return doc?.version ?? 0;
  } catch {
    return 0;
  }
}

export async function bumpDiscoverVersion() {
  try {
    const db = await getDb();
    await db.collection("content_versions").updateOne(
      KEY,
      { $inc: { version: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true },
    );
  } catch (err) {
    console.error("Failed to bump discover version:", err);
  }
}