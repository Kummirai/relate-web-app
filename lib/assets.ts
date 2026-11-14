/**
 * Normalizes an asset payload into the document shape stored in the `assets`
 * collection. Shared by create and update so edits never drift from new items.
 */

export const ASSET_CATEGORIES = [
  "Computer",
  "Mobile phone",
  "Tablet",
  "Printer",
  "Audio & visual",
  "Furniture",
  "Vehicle",
  "Tools",
  "Other",
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function normalizeCategory(value: unknown): AssetCategory {
  const match = ASSET_CATEGORIES.find(
    (category) => category.toLowerCase() === cleanText(value, 40).toLowerCase(),
  );
  return match ?? "Other";
}

/** Acquisition year is optional; anything outside a sane range is dropped. */
function normalizeYear(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const year = Math.trunc(n);
  if (year < 1900 || year > 2100) return null;
  return year;
}

export function buildAsset(body: any) {
  return {
    name: cleanText(body?.name, 160),
    category: normalizeCategory(body?.category),
    description: cleanText(body?.description, 2000),
    year: normalizeYear(body?.year),
    model: cleanText(body?.model, 160),
    // Plenty of items — furniture, tools — have no serial number at all.
    serialNumber: cleanText(body?.serialNumber, 160),
  };
}