import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ensureIndexes, resolveSession } from "@/lib/community-auth";
import {
  SMART_SAVER_COLLECTION,
  cents,
  ensureSmartSaverIndexes,
  rands,
  targetForAge,
  totalsFrom,
  withdrawalEntry,
  type LedgerEntry,
} from "@/lib/smart-saver";

/** Serialise a ledger row for the student's own view. */
function serialize(entry: any) {
  return {
    id: String(entry._id ?? ""),
    kind: entry.kind,
    status: entry.status,
    amount: rands(entry.amountCents ?? 0),
    vault: rands(entry.vaultCents ?? 0),
    wallet: rands(entry.walletCents ?? 0),
    note: entry.note ?? "",
    createdAt: entry.createdAt ?? null,
    settledAt: entry.settledAt ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await resolveSession(request);
    if (!session)
      return NextResponse.json({ error: "Sign in to view your savings." }, { status: 401 });

    const db = await getDb();
    await ensureIndexes(db);
    await ensureSmartSaverIndexes(db);

    const [entries, user] = await Promise.all([
      db
        .collection(SMART_SAVER_COLLECTION)
        .find({ userId: session.id })
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray(),
      db.collection("user").findOne({ id: session.id }, { projection: { age: 1 } }),
    ]);

    const totals = totalsFrom(entries as LedgerEntry[]);
    const target = targetForAge(user?.age);

    return NextResponse.json({
      data: {
        account: {
          vault: rands(totals.vaultCents),
          wallet: rands(totals.walletCents),
          pending: rands(totals.pendingCents),
          lifetime: rands(totals.lifetimeCents),
          withdrawn: rands(totals.withdrawnCents),
          age: Number.isFinite(Number(user?.age)) ? Number(user.age) : null,
          target,
        },
        entries: entries.map(serialize),
      },
    });
  } catch (e) {
    console.error("GET /api/smart-saver failed", e);
    return NextResponse.json({ error: "Failed to load savings." }, { status: 500 });
  }
}

/**
 * POST /api/smart-saver — request a withdrawal from the spendable wallet.
 * The vault is locked; only settled wallet funds can be withdrawn, and an
 * admin must approve the payout.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await resolveSession(request);
    if (!session)
      return NextResponse.json({ error: "Sign in to request a withdrawal." }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) ?? {};
    const amountCents = cents(body.amount);
    if (!amountCents)
      return NextResponse.json(
        { error: "Enter a withdrawal amount greater than R0." },
        { status: 400 },
      );

    const note = String(body.note ?? "").trim().slice(0, 240);

    const db = await getDb();
    await ensureIndexes(db);
    await ensureSmartSaverIndexes(db);

    const entries = (await db
      .collection(SMART_SAVER_COLLECTION)
      .find({ userId: session.id })
      .toArray()) as LedgerEntry[];
    const totals = totalsFrom(entries);
    const alreadyPending = entries
      .filter((e) => e.kind === "withdrawal" && e.status === "pending")
      .reduce((sum, e) => sum + e.amountCents, 0);

    if (amountCents > totals.walletCents - alreadyPending)
      return NextResponse.json(
        {
          error: `You can withdraw up to R${rands(
            Math.max(0, totals.walletCents - alreadyPending),
          )} from your spendable wallet.`,
        },
        { status: 400 },
      );

    const entry = withdrawalEntry(session.id, amountCents, note);
    const result = await db.collection(SMART_SAVER_COLLECTION).insertOne(entry);

    return NextResponse.json({
      data: serialize({ ...entry, _id: result.insertedId }),
    });
  } catch (e) {
    console.error("POST /api/smart-saver failed", e);
    return NextResponse.json({ error: "Failed to request withdrawal." }, { status: 500 });
  }
}
