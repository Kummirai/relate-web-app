/**
 * Shared validation for skill criteria grids.
 *
 * Criteria are no longer ticked by students — an instructor/admin marks them
 * from the admin skills screen. Both the student route (which now rejects
 * criteria writes) and the admin sign-off route use these helpers so the grid
 * shape is validated identically.
 */

export const MAX_REQUIREMENTS = 20;
export const MAX_CRITERIA = 12;

export type SkillStatus = "not_started" | "in_progress" | "complete";

export function statusOf(checks: boolean[]): SkillStatus {
  if (checks.length === 0) return "not_started";
  if (checks.every(Boolean)) return "complete";
  return checks.some(Boolean) ? "in_progress" : "not_started";
}

export function readTicks(body: Record<string, unknown>): boolean[][] | null {
  const rawCriteria = body.criteria;
  if (rawCriteria !== undefined) {
    if (!Array.isArray(rawCriteria) || rawCriteria.length < 1) return null;
    if (rawCriteria.length > MAX_REQUIREMENTS) return null;
    const grid: boolean[][] = [];
    for (const row of rawCriteria) {
      if (!Array.isArray(row) || row.length < 1 || row.length > MAX_CRITERIA)
        return null;
      if (!row.every((v) => typeof v === "boolean")) return null;
      grid.push(row as boolean[]);
    }
    return grid;
  }

  const raw = body.checks;
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > MAX_REQUIREMENTS)
    return null;
  if (!raw.every((v) => typeof v === "boolean")) return null;
  return (raw as boolean[]).map((c) => [c]);
}

export function checksFrom(criteria: boolean[][]): boolean[] {
  return criteria.map((row) => row.length > 0 && row.every(Boolean));
}
