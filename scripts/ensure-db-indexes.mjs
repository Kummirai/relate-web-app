import { connect } from "./lib/mongo.mjs";
import { ensureAllIndexes, INDEX_SPECS } from "../lib/db-indexes.mjs";

const { db, close } = await connect();
try {
  await db
    .collection("sponsorships")
    .updateMany({ status: "paid" }, { $set: { status: "approved" } });
  await db
    .collection("sponsorships")
    .updateMany({ status: "pledged" }, { $set: { status: "pending" } });
  const count = await ensureAllIndexes(db);
  console.log(`Ensured ${count} indexes on ${process.env.MONGODB_DB || "test"}`);
} finally {
  await close();
}
