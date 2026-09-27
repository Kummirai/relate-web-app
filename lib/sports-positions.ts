/**
 * Squad positions per sport — mirrors `constants/squads.ts` in the web app so
 * the API can validate a registration's position without importing site code.
 * Keep the two lists in step: a position the site renders must exist here.
 */

export type Sport = "Football" | "Netball" | "Volleyball";

export type PositionSlot = { name: string; code: string };

/** One entry per starting slot — some positions field two players. */
export const POSITION_SLOTS: Record<Sport, PositionSlot[]> = {
  Football: [
    { name: "Goalkeeper", code: "GK" },
    { name: "Right Back", code: "RB" },
    { name: "Centre Back", code: "CB" },
    { name: "Centre Back", code: "CB" },
    { name: "Left Back", code: "LB" },
    { name: "Defensive Midfielder", code: "DM" },
    { name: "Central Midfielder", code: "CM" },
    { name: "Attacking Midfielder", code: "AM" },
    { name: "Right Winger", code: "RW" },
    { name: "Striker", code: "ST" },
    { name: "Left Winger", code: "LW" },
  ],
  Netball: [
    { name: "Goal Shooter", code: "GS" },
    { name: "Goal Attack", code: "GA" },
    { name: "Wing Attack", code: "WA" },
    { name: "Centre", code: "C" },
    { name: "Wing Defence", code: "WD" },
    { name: "Goal Defence", code: "GD" },
    { name: "Goal Keeper", code: "GK" },
  ],
  Volleyball: [
    { name: "Setter", code: "S" },
    { name: "Outside Hitter", code: "OH" },
    { name: "Outside Hitter", code: "OH" },
    { name: "Middle Blocker", code: "MB" },
    { name: "Middle Blocker", code: "MB" },
    { name: "Opposite Hitter", code: "OPP" },
    { name: "Libero", code: "L" },
  ],
};

/** Slots on the team sheet — the first N registrants per squad make these up. */
export const SQUAD_SIZE: Record<Sport, number> = {
  Football: 11,
  Netball: 7,
  Volleyball: 7,
};

/**
 * How many registrants a single position holds per squad: the starter plus
 * depth. Beyond this the applicant is still accepted, as a waitlist entry.
 */
export const MAX_PER_POSITION = 3;

export function isSport(value: unknown): value is Sport {
  return value === "Football" || value === "Netball" || value === "Volleyball";
}

export function slotsForSport(sport: Sport): PositionSlot[] {
  return POSITION_SLOTS[sport] ?? [];
}

/** Distinct positions for the registration dropdown, in team-sheet order. */
export function positionsForSport(sport: Sport): PositionSlot[] {
  const seen = new Set<string>();
  return slotsForSport(sport).filter((slot) => {
    if (seen.has(slot.name)) return false;
    seen.add(slot.name);
    return true;
  });
}

export function positionCode(sport: Sport, position: string): string {
  return (
    slotsForSport(sport).find((slot) => slot.name === position)?.code ?? ""
  );
}

/** True when the sport fields this position at all (case-sensitive). */
export function isValidPosition(sport: Sport, position: string): boolean {
  return slotsForSport(sport).some((slot) => slot.name === position);
}
