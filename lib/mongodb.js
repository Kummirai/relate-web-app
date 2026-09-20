import { MongoClient, ServerApiVersion } from "mongodb";
import dns from "node:dns";
import os from "node:os";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "test";

const SRV_HOSTNAME = "_mongodb._tcp." + new URL(uri).hostname;

let resolverReady = false;

function resolverCandidates() {
  const list = [];
  for (const server of dns.getServers()) {
    if (!server.startsWith("127.") && server !== "::1") list.push(server);
  }
  for (const iface of Object.values(os.networkInterfaces()).flat()) {
    if (iface && !iface.internal && String(iface.family).startsWith("4")) {
      const base = iface.address.split(".").slice(0, 3).join(".");
      list.push(`${base}.1`, `${base}.254`, `${base}.2`);
    }
  }
  list.push("8.8.8.8", "1.1.1.1", "1.0.0.1", "9.9.9.9");
  return [...new Set(list)];
}

function probe(server) {
  return new Promise((resolve, reject) => {
    const resolver = new dns.Resolver();
    resolver.setServers([server]);
    const timer = setTimeout(() => {
      resolver.cancel();
      reject(new Error("timeout"));
    }, 4000);
    resolver.resolveSrv(SRV_HOSTNAME, (err, records) => {
      clearTimeout(timer);
      if (err) reject(err);
      else if (!records?.length) reject(new Error("no records"));
      else resolve(true);
    });
  });
}

async function ensureSrvResolvable() {
  if (resolverReady) return;
  for (const server of resolverCandidates()) {
    try {
      await probe(server);
      dns.setServers([server]);
      resolverReady = true;
      return;
    } catch {}
  }
  throw new Error(`querySrv failed for ${SRV_HOSTNAME} on all available DNS resolvers`);
}

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
  await ensureSrvResolvable();
  await client.connect();
  db = client.db(dbName);
  return db;
}

export async function getDb() {
  if (!db) await connectToDB();
  return db;
}