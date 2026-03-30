// scripts/make-admin.ts
import { MongoClient } from "mongodb";

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  const db = client.db();
  await db
    .collection("user")
    .updateOne({ email: process.env.ADMIN_EMAIL }, { $set: { role: "admin" } });

  console.log("✅ Done! User promoted to admin.");
  await client.close();
}

main();
