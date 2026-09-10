const check = async () => {
  const { MongoClient } = await import("mongodb");
  process.env.MONGODB_URI = (() => {
    const u = new URL(process.env.MONGODB_URI);
    const db = (u.pathname || "").replace(/^\//, "") || "test";
    const user = u.username ? encodeURIComponent(decodeURIComponent(u.username)) : "";
    const pass = u.password ? encodeURIComponent(decodeURIComponent(u.password)) : "";
    const hosts = [
      "ac-1nhlscd-shard-00-00.pdugedk.mongodb.net:27017",
      "ac-1nhlscd-shard-00-01.pdugedk.mongodb.net:27017",
      "ac-1nhlscd-shard-00-02.pdugedk.mongodb.net:27017",
    ];
    const creds = user || pass ? `${user}:${pass}@` : "";
    return `mongodb://${creds}${hosts.join(",")}/${db}?ssl=true&authSource=admin&retryWrites=true&w=majority`;
  })();
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const col = client.db().collection("publications");
  const spring = await col
    .find({ id: /spring-2026$/ })
    .project({ id: 1, kind: 1, clubSlug: 1, tags: 1, status: 1, publishedAt: 1 })
    .toArray();
  console.log(JSON.stringify(spring, null, 2));
  const counts = await col
    .aggregate([{ $group: { _id: "$kind", n: { $sum: 1 } } }, { $sort: { _id: 1 } }])
    .toArray();
  console.log("kind counts:", JSON.stringify(counts));
  await client.close();
};
await check();