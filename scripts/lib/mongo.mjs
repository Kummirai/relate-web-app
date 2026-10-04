/**
 * Mongo connection for scripts — mirrors the SRV/DNS workaround in
 * lib/mongodb.js (the app's runtime resolver), which the plain MongoClient
 * constructor in these scripts does not get.
 *
 *   const { db, close } = await connect();
 *   ...
 *   await close();
 */
import { MongoClient, ServerApiVersion } from "mongodb";
import dns from "node:dns";
import os from "node:os";

export function requireEnv() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Run with --env-file=.env.local. Aborting.");
    process.exit(1);
  }
  return {
    uri,
    dbName: process.env.MONGODB_DB || "test",
  };
}

function resolverCandidates(srvHostname) {
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

function probe(server, srvHostname) {
  return new Promise((resolve, reject) => {
    const resolver = new dns.Resolver();
    resolver.setServers([server]);
    const timer = setTimeout(() => {
      resolver.cancel();
      reject(new Error("timeout"));
    }, 4000);
    resolver.resolveSrv(srvHostname, (err, records) => {
      clearTimeout(timer);
      if (err) reject(err);
      else if (!records?.length) reject(new Error("no records"));
      else resolve(true);
    });
  });
}

let resolverReady = false;

async function ensureSrvResolvable(uri) {
  if (resolverReady) return;
  const srvHostname = "_mongodb._tcp." + new URL(uri).hostname;
  for (const server of resolverCandidates(srvHostname)) {
    try {
      await probe(server, srvHostname);
      dns.setServers([server]);
      resolverReady = true;
      return;
    } catch {
      /* try the next resolver */
    }
  }
  throw new Error(`querySrv failed for ${srvHostname} on all available DNS resolvers`);
}

/** Connect to the database configured by MONGODB_URI / MONGODB_DB. */
export async function connect() {
  const { uri, dbName } = requireEnv();
  await ensureSrvResolvable(uri);
  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });
  await client.connect();
  return { client, db: client.db(dbName), close: () => client.close() };
}
