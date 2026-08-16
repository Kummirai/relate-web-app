/**
 * Event fee helpers. Event `fee` is stored as a display string (e.g. "K 150",
 * "$25", "FREE"), but payment tracking needs a numeric amount + currency
 * symbol. parseFee extracts both; everything else uses those numbers.
 */
export type FeeInfo = {
  amount: number;
  symbol: string;
};

export function parseFee(fee?: string | number | null): FeeInfo {
  if (fee == null || fee === "") return { amount: 0, symbol: "" };
  if (typeof fee === "number") {
    return { amount: Math.max(0, fee), symbol: "" };
  }
  const cleaned = String(fee).trim();
  if (!cleaned || /^(free|none|0)$/i.test(cleaned)) {
    return { amount: 0, symbol: "" };
  }
  const symbol = (cleaned.match(/^[^\d.\-]+/) || [""])[0].trim();
  const amount = parseFloat(cleaned.replace(/[^\d.]/g, "")) || 0;
  return { amount: Math.round(amount * 100) / 100, symbol };
}

export function formatFee(symbol: string, amount: number): string {
  if (amount <= 0) return "FREE";
  return `${symbol}${Math.round(amount * 100) / 100}`;
}
