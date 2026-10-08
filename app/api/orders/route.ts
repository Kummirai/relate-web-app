import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import {
  buildOrderDoc,
  ensureOrderIndexes,
  loadCatalogue,
  nextOrderNumber,
  serializeOrder,
} from "@/lib/orders";
import { publicOptions } from "@/lib/public-api/render";

const BANKING_SETTINGS_ID = "sponsorship_banking";

/** Banking details are shared by sponsorship pledges and store checkouts. */
async function bankingFor(db: any) {
  const doc = await db.collection("settings").findOne({ _id: BANKING_SETTINGS_ID });
  if (doc?.banking && typeof doc.banking === "object") {
    return {
      bankName: doc.banking.bankName ?? "",
      accountHolder: doc.banking.accountHolder ?? "",
      accountNumber: doc.banking.accountNumber ?? "",
      branchCode: doc.banking.branchCode ?? "",
      accountType: doc.banking.accountType ?? "",
      reference: doc.banking.reference ?? "",
      instructions: doc.banking.instructions ?? "",
    };
  }
  return null;
}

/**
 * Checkout and order history.
 *
 *   POST /api/orders   Place an order (signed-in buyers only).
 *   GET  /api/orders   The signed-in buyer's orders, newest first.
 *
 * The receipt returned by POST carries the order number and the banking
 * details so the buyer can pay by EFT immediately — payment is confirmed by
 * an admin, which moves the order to `payment_received`.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to place an order" },
        { status: 401 },
      );
    }

    // The body must be read before any auth helper touches the stream again.
    const body = await request.json().catch(() => ({}));
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const ids = rawItems
      .map((it: any) => String(it?.itemId ?? "").trim())
      .filter(Boolean);

    const db = await getDb();
    await ensureOrderIndexes(db);

    const catalogue = await loadCatalogue(db, ids);
    const doc = await buildOrderDoc({
      items: rawItems,
      customer: body.customer,
      user,
      catalogue,
    });

    doc.orderNumber = await nextOrderNumber(db);
    const result = await db.collection("orders").insertOne(doc);

    const order = serializeOrder({ ...doc, _id: result.insertedId });
    return NextResponse.json(
      { data: { order, banking: await bankingFor(db) } },
      { status: 201 },
    );
  } catch (err: any) {
    const message =
      typeof err?.message === "string" ? err.message : "Couldn't place the order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to see your orders" },
        { status: 401 },
      );
    }

    const db = await getDb();
    await ensureOrderIndexes(db);
    const docs = await db
      .collection("orders")
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ data: docs.map(serializeOrder) });
  } catch {
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 },
    );
  }
}

export { publicOptions as OPTIONS };
