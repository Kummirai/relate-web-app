/**
 * Store orders — the shared schema for checkout, order tracking and admin
 * fulfilment.
 *
 * Lifecycle (each transition is appended to `statusHistory` so the mobile
 * timeline and the admin queue read the same history):
 *
 *   received          Order received — waiting for payment (EFT / transfer)
 *   payment_received  Payment received — being processed
 *   shipped           Order shipped
 *   delivered         Order delivered
 *   cancelled         Terminal — set by an admin
 *
 * Prices are always recomputed server-side from `store_items`, so a tampered
 * client payload can never change what the buyer pays.
 */

export const ORDERS_COLLECTION = "orders";

export const ORDER_STATUSES = [
  "received",
  "payment_received",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  received: "Order received",
  payment_received: "Payment received",
  shipped: "Order shipped",
  delivered: "Order delivered",
  cancelled: "Cancelled",
};

/** The buyer-facing sub-caption shown under each step. */
export const ORDER_STATUS_SUB: Record<OrderStatus, string> = {
  received: "Waiting for payment",
  payment_received: "Being processed",
  shipped: "On its way",
  delivered: "Delivered",
  cancelled: "Order cancelled",
};

/** Steps the mobile timeline walks through (cancelled orders diverge). */
export const ORDER_PROGRESS: OrderStatus[] = [
  "received",
  "payment_received",
  "shipped",
  "delivered",
];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(value)
  );
}

export type OrderItem = {
  itemId: string;
  name: string;
  /** Unit price in ZAR, taken from the catalogue (never the client). */
  price: number;
  qty: number;
  size?: string | null;
  image?: string;
};

export type OrderStatusEntry = {
  status: OrderStatus;
  at: string;
  note?: string;
};

export function ensureOrderIndexes(db: any) {
  return Promise.all([
    db.collection(ORDERS_COLLECTION).createIndex({ createdAt: -1 }),
    db.collection(ORDERS_COLLECTION).createIndex({ userId: 1, createdAt: -1 }),
    db.collection(ORDERS_COLLECTION).createIndex({ status: 1, createdAt: -1 }),
    db.collection(ORDERS_COLLECTION).createIndex({ orderNumber: 1 }, { unique: true }),
  ]);
}

export function serializeOrder(doc: any) {
  return {
    _id: String(doc._id),
    orderNumber: doc.orderNumber,
    userId: doc.userId ?? null,
    customerName: doc.customerName ?? "",
    phone: doc.phone ?? "",
    email: doc.email ?? "",
    note: doc.note ?? "",
    items: Array.isArray(doc.items) ? doc.items : [],
    subtotal: doc.subtotal ?? 0,
    total: doc.total ?? 0,
    currency: doc.currency ?? "ZAR",
    status: isOrderStatus(doc.status) ? doc.status : "received",
    statusHistory: Array.isArray(doc.statusHistory) ? doc.statusHistory : [],
    eta: doc.eta ?? null,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/**
 * Sequence number for receipts: `RW-2026-0001`. The counter lives in the
 * `settings` collection and is incremented atomically, so two checkouts can
 * never be handed the same order number.
 */
export async function nextOrderNumber(db: any): Promise<string> {
  const res = await db.collection("settings").findOneAndUpdate(
    { _id: "store_order_counter" },
    { $inc: { seq: 1 }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, returnDocument: "after" },
  );
  const seq = Number(res?.seq ?? 1);
  const year = new Date().getFullYear();
  return `RW-${year}-${String(Number.isFinite(seq) ? seq : 1).padStart(4, "0")}`;
}

/** Default ETA handed to the buyer up front; an admin can override it. */
export function defaultEta(days = 7): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export type BuildOrderInput = {
  items?: unknown;
  customer?: { name?: unknown; phone?: unknown; email?: unknown; note?: unknown };
  user: { id: string; name: string | null };
  /** Catalogue rows keyed by item id — the price source of truth. */
  catalogue: Map<string, any>;
};

/**
 * Validates the checkout payload and prices it against the live catalogue.
 * Throws `Error` with a buyer-readable message on invalid input.
 */
export async function buildOrderDoc(input: BuildOrderInput): Promise<any> {
  const rawItems = Array.isArray(input.items) ? input.items : [];
  if (rawItems.length === 0) throw new Error("Your cart is empty");
  if (rawItems.length > 50) throw new Error("Too many items in one order");

  const items: OrderItem[] = [];
  for (const raw of rawItems) {
    const itemId = clean((raw as any)?.itemId, 80);
    const size = clean((raw as any)?.size, 20) || null;
    const qty = Math.floor(Number((raw as any)?.qty));
    if (!itemId) throw new Error("Every cart line needs a product");
    if (!Number.isFinite(qty) || qty < 1 || qty > 20) {
      throw new Error("Quantity must be between 1 and 20");
    }

    const product = input.catalogue.get(itemId);
    if (!product) throw new Error(`A product in your cart is no longer available`);
    if (product.active === false || product.inStock === false) {
      throw new Error(`${product.name} is out of stock`);
    }
    if (Array.isArray(product.sizes) && product.sizes.length > 0 && size && !product.sizes.includes(size)) {
      throw new Error(`Invalid size for ${product.name}`);
    }

    const unit =
      typeof product.offerPrice === "number" && product.offerPrice >= 0
        ? product.offerPrice
        : Number(product.price) || 0;

    items.push({
      itemId: product.id || itemId,
      name: String(product.name),
      price: unit,
      qty,
      size,
      image: String(product.image || ""),
    });
  }

  const customer = input.customer ?? {};
  const customerName = clean(customer.name, 120);
  const phone = clean(customer.phone, 40);
  const email = clean(customer.email, 160);
  if (!customerName) throw new Error("Your name is required");
  if (!phone) throw new Error("A contact number is required");

  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);

  const now = new Date();
  return {
    orderNumber: "", // filled in by the caller — the counter is async
    userId: input.user.id,
    customerName,
    phone,
    email,
    note: clean(customer.note, 500),
    items,
    subtotal,
    total: subtotal,
    currency: "ZAR",
    status: "received" as OrderStatus,
    statusHistory: [
      { status: "received" as OrderStatus, at: now.toISOString() },
    ] satisfies OrderStatusEntry[],
    eta: defaultEta(),
    createdAt: now,
    updatedAt: now,
  };
}

/** Looks up the catalogue rows a cart references (for server-side pricing). */
export async function loadCatalogue(
  db: any,
  itemIds: string[],
): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  const ids = Array.from(new Set(itemIds.filter(Boolean)));
  if (ids.length === 0) return map;
  const rows = await db
    .collection("store_items")
    .find({ id: { $in: ids } })
    .toArray();
  for (const row of rows) map.set(row.id, row);
  return map;
}
