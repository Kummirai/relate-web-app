import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { ensureIndexes, requireAdmin } from "@/lib/community-auth";
import { createNotification } from "@/lib/inapp-notify";
import {
  SMART_SAVER_COLLECTION,
  cents,
  contributionEntry,
  ensureSmartSaverIndexes,
  rands,
  targetForAge,
  totalsFrom,
  type LedgerEntry,
} from "@/lib/smart-saver";

/**
 * Smart Saver administration — blueprint §3.
 *
 * Admins credit savings (split 60/40 immediately, queued until the Saturday
 * batch settlement), settle the weekly queue, and approve or reject student
 * withdrawal requests from the spendable wallet.
 */

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDb();
    await ensureIndexes(db);
    await ensureSmartSaverIndexes(db);

    const entries = (await db
      .collection(SMART_SAVER_COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .limit(5000)
      .toArray()) as any[];

    const byUser = new Map<string, any[]>();
    for (const entry of entries) {
      const id = String(entry.userId ?? "");
      if (!id) continue;
      const list = byUser.get(id) ?? [];
      list.push(entry);
      byUser.set(id, list);
    }

    const userIds = Array.from(byUser.keys());
    const users: any[] = userIds.length
      ? await db
          .collection("user")
          .find({ id: { $in: userIds } })
          .project({ id: 1, name: 1, email: 1, age: 1 })
          .toArray()
      : [];
    const byId: Record<string, any> = {};
    for (const u of users) byId[String(u.id)] = u;

    const accounts = userIds.map((userId) => {
      const user = byId[userId] ?? {};
      const totals = totalsFrom(byUser.get(userId) as LedgerEntry[]);
      return {
        userId,
        name: user.name || "Unknown member",
        email: user.email || "",
        age: Number.isFinite(Number(user.age)) ? Number(user.age) : null,
        target: targetForAge(user.age),
        vault: rands(totals.vaultCents),
        wallet: rands(totals.walletCents),
        pending: rands(totals.pendingCents),
        lifetime: rands(totals.lifetimeCents),
        withdrawn: rands(totals.withdrawnCents),
        updatedAt: byUser.get(userId)?.[0]?.createdAt ?? null,
      };
    });

    const pendingWithdrawals = entries
      .filter((e) => e.kind === "withdrawal" && e.status === "pending")
      .map((e) => ({
        id: String(e._id),
        userId: String(e.userId),
        name: byId[String(e.userId)]?.name || "Unknown member",
        email: byId[String(e.userId)]?.email || "",
        amount: rands(e.amountCents ?? 0),
        note: e.note ?? "",
        createdAt: e.createdAt ?? null,
      }));

    const pendingQueue = entries
      .filter((e) => e.kind === "contribution" && e.status === "pending")
      .reduce(
        (acc, e) => ({
          count: acc.count + 1,
          amount: acc.amount + rands(e.amountCents ?? 0),
        }),
        { count: 0, amount: 0 },
      );

    return NextResponse.json({ data: { accounts, pendingWithdrawals, pendingQueue } });
  } catch (e) {
    console.error("GET /api/admin/smart-saver failed", e);
    return NextResponse.json({ error: "Failed to load savings." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) ?? {};
    const action = String(body.action ?? "");
    const db = await getDb();
    await ensureIndexes(db);
    await ensureSmartSaverIndexes(db);

    if (action === "credit") {
      const userId = String(body.userId || "").trim();
      const amountCents = cents(body.amount);
      const note = String(body.note ?? "").trim().slice(0, 240);
      if (!userId)
        return NextResponse.json({ error: "userId is required." }, { status: 400 });
      if (!amountCents)
        return NextResponse.json(
          { error: "Enter a credit amount greater than R0." },
          { status: 400 },
        );

      const entry = contributionEntry(userId, amountCents, note, admin);
      await db.collection(SMART_SAVER_COLLECTION).insertOne(entry);

      await createNotification(db, userId, {
        type: "smart_saver_credit",
        title: "Savings credited",
        body: `R${rands(amountCents)} added — R${rands(entry.vaultCents)} to your University Freedom Fund and R${rands(
          entry.walletCents,
        )} to your wallet after Saturday settlement.`,
        data: { amount: rands(amountCents) },
      });

      return NextResponse.json({
        data: {
          vault: rands(entry.vaultCents),
          wallet: rands(entry.walletCents),
          pending: rands(amountCents),
        },
      });
    }

    if (action === "settle") {
      const result = await db.collection(SMART_SAVER_COLLECTION).updateMany(
        { kind: "contribution", status: "pending" },
        { $set: { status: "settled", settledAt: new Date() } },
      );
      return NextResponse.json({ data: { settled: result.modifiedCount } });
    }

    if (action === "withdrawal") {
      const id = String(body.id || "").trim();
      const status = String(body.status || "");
      if (!ObjectId.isValid(id))
        return NextResponse.json({ error: "Invalid withdrawal id." }, { status: 400 });
      if (!["paid", "rejected"].includes(status))
        return NextResponse.json(
          { error: "status must be paid or rejected." },
          { status: 400 },
        );

      const _id = new ObjectId(id);
      const found = await db
        .collection(SMART_SAVER_COLLECTION)
        .findOne({ _id, kind: "withdrawal" });
      if (!found)
        return NextResponse.json({ error: "Withdrawal not found." }, { status: 404 });
      if (found.status !== "pending")
        return NextResponse.json(
          { error: "This withdrawal has already been reviewed." },
          { status: 400 },
        );

      await db.collection(SMART_SAVER_COLLECTION).updateOne(
        { _id },
        {
          $set: {
            status,
            reviewedBy: admin.id,
            reviewedByName: admin.name,
            reviewedAt: new Date(),
          },
        },
      );

      await createNotification(db, String(found.userId), {
        type: "smart_saver_withdrawal",
        title: status === "paid" ? "Withdrawal paid" : "Withdrawal declined",
        body:
          status === "paid"
            ? `R${rands(found.amountCents ?? 0)} has been paid out from your wallet.`
            : `Your R${rands(found.amountCents ?? 0)} withdrawal request was declined.`,
        data: { amount: rands(found.amountCents ?? 0) },
      });

      return NextResponse.json({ data: { id, status } });
    }

    return NextResponse.json(
      { error: "Send action credit, settle or withdrawal." },
      { status: 400 },
    );
  } catch (e) {
    console.error("POST /api/admin/smart-saver failed", e);
    return NextResponse.json({ error: "Failed to update savings." }, { status: 500 });
  }
}
