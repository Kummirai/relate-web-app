import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;

export const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

export async function connectToDB() {
  if (db) return db;
  await client.connect();
  db = client.db("test");
  console.log("Connected to MongoDB: test");
  return db;
}

export async function getDb() {
  if (!db) await connectToDB();
  return db;
}
