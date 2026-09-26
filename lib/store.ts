/**
 * Shared store (merch) definitions.
 *
 * Mirrors STORE_CATEGORIES / StoreItem in web_app/constants/relate.ts so admin
 * writes and the public storefront speak the same shape.
 */

export const STORE_CATEGORIES = ["Apparel", "Accessories", "Home & Study"] as const;

export type StoreCategory = (typeof STORE_CATEGORIES)[number];

export const STORE_COLLECTION = "store_items";

export function ensureStoreIndexes(db: any) {
  return Promise.all([
    db.collection(STORE_COLLECTION).createIndex({ createdAt: -1 }),
    db.collection(STORE_COLLECTION).createIndex({ active: 1, createdAt: -1 }),
    db.collection(STORE_COLLECTION).createIndex({ category: 1 }),
  ]);
}

export function serializeStoreItem(doc: any) {
  return {
    _id: doc._id.toString(),
    id: doc.id,
    category: doc.category,
    name: doc.name,
    price: doc.price,
    blurb: doc.blurb ?? "",
    image: doc.image ?? "",
    images: doc.images ?? [],
    sizes: doc.sizes ?? [],
    details: doc.details ?? [],
    offerPrice: doc.offerPrice ?? null,
    rating: doc.rating ?? null,
    inStock: doc.inStock !== false,
    active: doc.active !== false,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

/** Builds a URL-safe id from a name, e.g. "Relate Tee (Black)" -> "relate-tee-black". */
export function slugifyStoreId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || `item-${Date.now().toString(36)}`;
}

/** Normalizes admin input into a storable document. Shared by create and update. */
export function buildStoreItemDoc(data: any, existing?: any) {
  const toList = (v: any): string[] => {
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    if (typeof v === "string")
      return v
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
    return [];
  };
  const toNumber = (v: any): number | null => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const name = String(data.name ?? existing?.name ?? "").trim();
  if (!name) throw new Error("Item name is required");

  const price = toNumber(data.price ?? existing?.price);
  if (price === null || price < 0) throw new Error("A valid price is required");

  const offerPrice = toNumber(
    data.offerPrice === "" ? null : (data.offerPrice ?? existing?.offerPrice),
  );
  if (offerPrice !== null && offerPrice < 0) throw new Error("Offer price cannot be negative");
  if (offerPrice !== null && offerPrice > price) {
    throw new Error("Offer price cannot be higher than the price");
  }

  const category = String(data.category ?? existing?.category ?? "").trim();
  if (!(STORE_CATEGORIES as readonly string[]).includes(category)) {
    throw new Error(`Category must be one of: ${STORE_CATEGORIES.join(", ")}`);
  }

  return {
    name,
    category,
    price,
    offerPrice,
    blurb: String(data.blurb ?? existing?.blurb ?? "").trim(),
    image: String(data.image ?? existing?.image ?? "").trim(),
    images: data.images !== undefined ? toList(data.images) : (existing?.images ?? []),
    sizes: data.sizes !== undefined ? toList(data.sizes) : (existing?.sizes ?? []),
    details: data.details !== undefined ? toList(data.details) : (existing?.details ?? []),
    rating: toNumber(data.rating === "" ? null : (data.rating ?? existing?.rating)),
    inStock: data.inStock === undefined ? (existing?.inStock !== false) : data.inStock !== false,
    active: data.active === undefined ? (existing?.active !== false) : data.active !== false,
  };
}
