/**
 * Smart Saver targets — blueprint §5. Shared by the student and admin APIs.
 */
export type SavingsTarget = {
  age: number;
  weekly: number;
  annual: number;
  cumulative: number;
};

export const SAVINGS_TARGETS: SavingsTarget[] = [
  { age: 6, weekly: 5, annual: 250, cumulative: 250 },
  { age: 7, weekly: 8, annual: 400, cumulative: 650 },
  { age: 8, weekly: 12, annual: 600, cumulative: 1250 },
  { age: 9, weekly: 16, annual: 800, cumulative: 2050 },
  { age: 10, weekly: 20, annual: 1000, cumulative: 3050 },
  { age: 11, weekly: 25, annual: 1250, cumulative: 4300 },
  { age: 12, weekly: 30, annual: 1500, cumulative: 5800 },
  { age: 13, weekly: 35, annual: 1750, cumulative: 7550 },
  { age: 14, weekly: 40, annual: 2000, cumulative: 9550 },
  { age: 15, weekly: 48, annual: 2400, cumulative: 11950 },
  { age: 16, weekly: 55, annual: 2750, cumulative: 14700 },
];

export function savingsForAge(age: number): SavingsTarget | null {
  const n = Math.trunc(Number(age));
  return SAVINGS_TARGETS.find((t) => t.age === n) ?? null;
}

/** Immutable split — 60% University Freedom Fund vault, 40% spendable wallet. */
export const SMART_SAVER_SPLIT = { vault: 0.6, wallet: 0.4 } as const;

export function splitContribution(amount: number) {
  const cents = Math.round(Math.max(0, Number(amount) || 0) * 100);
  const vaultCents = Math.round(cents * SMART_SAVER_SPLIT.vault);
  return {
    vault: vaultCents / 100,
    wallet: (cents - vaultCents) / 100,
  };
}

/** Saturday batch settlement day (0 = Sunday). */
export const SETTLEMENT_DAY = 6;
