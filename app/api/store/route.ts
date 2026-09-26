import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ensureStoreIndexes, serializeStoreItem } from "@/lib/store";
import { publicError, publicJson, publicOptions, publicTooMany } from "@/lib/public-api/render";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";

/**
 * Public merch catalogue.
 *
 *   GET /api/store                 Active items, newest first.
 *   GET /api/store?category=Apparel Filter by category.
 *   GET /api/store?countOnly=1     Just the active count.
 *
 * Reads are intentionally unauthenticated — the storefront is public. The
 * storefront falls back to the bundled STORE_ITEMS constants when this returns
 * an empty list, so an unseeded database never blanks the store.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`store:${clientIp(request)}`);
    if (!rl.ok) {
      return publicTooMany();
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const includeInactive = searchParams.get("all") === "1";

    const filter: Record<string, unknown> = {};
    if (category && category !== "all") filter.category = category;
    if (!includeInactive) filter.active = { $ne: false };

    const db = await getDb();
    await ensureStoreIndexes(db);
    const col = db.collection("store_items");

    if (searchParams.get("countOnly") === "1") {
      const count = await col.countDocuments(filter);
      return NextResponse.json({ count });
    }

    const docs = await col.find(filter).sort({ createdAt: -1 }).limit(200).toArray();
    return publicJson({ data: docs.map(serializeStoreItem) }, { headers: rateLimitHeaders(rl) });
  } catch {
    return publicError();
  }
}

export { publicOptions as OPTIONS };
