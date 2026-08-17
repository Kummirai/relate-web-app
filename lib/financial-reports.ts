export function toNonNegNumber(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(n, 1_000_000_000));
}

export function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Normalizes a financial report payload into the document shape stored in the
 * `financial_reports` collection. Shared by the create and update routes so
 * edits never drift from new reports.
 */
export function buildFinancialReport(body: any, fallbackName: string) {
  return {
    period: cleanText(body?.period, 60),
    preparedBy: cleanText(body?.preparedBy, 120) || fallbackName,
    status: "published",
    income: {
      balanceBroughtDown: toNonNegNumber(body?.income?.balanceBroughtDown),
      sponsorships: toNonNegNumber(body?.income?.sponsorships),
      events: toNonNegNumber(body?.income?.events),
      donations: toNonNegNumber(body?.income?.donations),
      books: toNonNegNumber(body?.income?.books),
      other: toNonNegNumber(body?.income?.other),
      otherDescription: cleanText(body?.income?.otherDescription, 200),
    },
    expenses: {
      meals: toNonNegNumber(body?.expenses?.meals),
      groceries: toNonNegNumber(body?.expenses?.groceries),
      tuition: toNonNegNumber(body?.expenses?.tuition),
      transport: toNonNegNumber(body?.expenses?.transport),
      employment: toNonNegNumber(body?.expenses?.employment),
      materials: toNonNegNumber(body?.expenses?.materials),
      other: toNonNegNumber(body?.expenses?.other),
      otherDescription: cleanText(body?.expenses?.otherDescription, 200),
      amountsFromRecords: toNonNegNumber(body?.expenses?.amountsFromRecords),
    },
    impact: {
      families: toNonNegNumber(body?.impact?.families),
      mealsServed: toNonNegNumber(body?.impact?.mealsServed),
      children: toNonNegNumber(body?.impact?.children),
      placements: toNonNegNumber(body?.impact?.placements),
      events: toNonNegNumber(body?.impact?.events),
    },
    otherActivities: cleanText(body?.otherActivities, 4000),
    notes: cleanText(body?.notes, 2000),
    customFields: Array.isArray(body?.customFields)
      ? body.customFields
          .filter((f: any) => f && (typeof f.title === "string" || typeof f.content === "string"))
          .slice(0, 20)
          .map((f: any) => ({
            title: cleanText(f.title, 200),
            content: cleanText(f.content, 2000),
          }))
      : [],
  };
}
