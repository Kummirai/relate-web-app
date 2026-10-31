import { savingsForAge, splitContribution } from "@/lib/savings";

/**
 * Smart Saver ledger — blueprint §3.
 *
 * Every credit is split 60/40 the moment it is recorded: 60% into the locked
 * University Freedom Fund vault, 40% into the spendable wallet. Contributions
 * sit in the pending weekly queue until the Saturday batch settlement, so the
 * ledger always shows what is pending versus what is available.
 *
 * All money is stored in cents; the API converts to rand at the edge.
 */

export const SMART_SAVER_COLLECTION = "smart_saver_ledger";

export type LedgerKind = "contribution" | "withdrawal";
export type LedgerStatus = "pending" | "settled" | "paid" | "rejected";

export type LedgerEntry = {
  userId: string;
  kind: LedgerKind;
  status: LedgerStatus;
  amountCents: number;
  vaultCents: number;
  walletCents: number;
  note: string;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date;
  settledAt: Date | null;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: Date | null;
};

export function rands(cents: number): number {
  return Math.round(cents) / 100;
}

export function cents(amount: unknown): number | null {
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n * 100);
  if (rounded <= 0 || rounded > 10_000_000) return null;
  return rounded;
}

export function contributionEntry(
  userId: string,
  amountCents: number,
  note: string,
  admin: { id: string; name: string | null },
): LedgerEntry {
  const split = splitContribution(amountCents / 100);
  return {
    userId,
    kind: "contribution",
    status: "pending",
    amountCents,
    vaultCents: Math.round(split.vault * 100),
    walletCents: Math.round(split.wallet * 100),
    note,
    createdBy: admin.id,
    createdByName: admin.name,
    createdAt: new Date(),
    settledAt: null,
  };
}

export function withdrawalEntry(
  userId: string,
  amountCents: number,
  note: string,
): LedgerEntry {
  return {
    userId,
    kind: "withdrawal",
    status: "pending",
    amountCents,
    vaultCents: 0,
    walletCents: 0,
    note,
    createdBy: userId,
    createdByName: null,
    createdAt: new Date(),
    settledAt: null,
  };
}

export type AccountTotals = {
  vaultCents: number;
  walletCents: number;
  pendingCents: number;
  lifetimeCents: number;
  withdrawnCents: number;
};

export function totalsFrom(entries: LedgerEntry[]): AccountTotals {
  const totals: AccountTotals = {
    vaultCents: 0,
    walletCents: 0,
    pendingCents: 0,
    lifetimeCents: 0,
    withdrawnCents: 0,
  };
  for (const entry of entries) {
    if (entry.kind === "contribution") {
      if (entry.status === "settled") {
        totals.vaultCents += entry.vaultCents;
        totals.walletCents += entry.walletCents;
        totals.lifetimeCents += entry.amountCents;
      } else if (entry.status === "pending") {
        totals.pendingCents += entry.amountCents;
        totals.lifetimeCents += entry.amountCents;
      }
    } else if (entry.kind === "withdrawal" && entry.status === "paid") {
      totals.walletCents -= entry.amountCents;
      totals.withdrawnCents += entry.amountCents;
    }
  }
  totals.walletCents = Math.max(0, totals.walletCents);
  return totals;
}

export function targetForAge(age: unknown) {
  const n = Number(age);
  if (!Number.isFinite(n)) return null;
  return savingsForAge(n);
}

export async function ensureSmartSaverIndexes(db: any) {
  await Promise.all([
    db
      .collection(SMART_SAVER_COLLECTION)
      .createIndex({ userId: 1, createdAt: -1 }),
    db
      .collection(SMART_SAVER_COLLECTION)
      .createIndex({ status: 1, kind: 1 }),
  ]);
}
