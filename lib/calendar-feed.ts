import type { Db } from "mongodb";
import { listAllClubs } from "./clubs";
import { parseTimeRange } from "./calendar-ics";
import {
  ORGANIZATION_CALENDAR_NAME,
  ORGANIZATION_SCOPE,
  listCalendarYears,
  listCalendars,
  type ProgramCalendarDoc,
} from "./program-calendar";

/**
 * The whole-app agenda: every dated thing Relate runs, read from the records
 * that already own it rather than copied into the calendar.
 *
 *   program   the published year plan (Relate or a club)
 *   event     community_events — organization-wide and club events
 *   board     board_meetings — governance, admins only
 *   training  trainings — officer training, admins only, one row per day
 *
 * Board meetings and trainings are admin-only everywhere else, so they are
 * only merged in for an admin caller. Nothing here writes: each source keeps
 * its own editor, and the calendar only adds programme dates of its own.
 */

/** Wire sentinel for "every scope at once"; never a stored club slug. */
export const ALL_SCOPES = "all";

export type CalendarFeedSource = "program" | "event" | "board" | "training";

export type CalendarFeedItem = {
  /** Unique across sources, so a merged list has stable React keys. */
  id: string;
  source: CalendarFeedSource;
  /** Badge text: "Programme", the event's category, "Board meeting", "Training". */
  kind: string;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  location?: string;
  description?: string;
  /** "relate" or the club slug this belongs to. */
  scope: string;
  scopeName: string;
  term?: string;
  setting?: string;
  /** Id in the owning collection, for opening the record at its source. */
  refId: string;
};

export type CalendarFeed = {
  year: number;
  scope: string;
  /** Display name of the selected scope, used by the export's calendar name. */
  scopeName: string;
  isAdmin: boolean;
  /** Years with a published plan, so an empty year can point at a full one. */
  programmeYears: number[];
  items: CalendarFeedItem[];
};

/** SAST is a fixed +0200 with no DST, so wall-clock is a plain offset shift. */
const SAST_OFFSET_MINUTES = 120;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const EVENT_FIELDS = {
  title: 1,
  date: 1,
  time: 1,
  dateTo: 1,
  timeTo: 1,
  location: 1,
  description: 1,
  category: 1,
  clubSlug: 1,
} as const;

const MEETING_FIELDS = {
  title: 1,
  scheduledDate: 1,
  location: 1,
  status: 1,
} as const;

const TRAINING_FIELDS = {
  title: 1,
  description: 1,
  scheduledDate: 1,
  location: 1,
  days: 1,
} as const;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function text(value: unknown, max = 400): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isoDate(value: unknown): string {
  const candidate = text(value, 10);
  return ISO_DATE.test(candidate) ? candidate : "";
}

function inYear(date: string, year: number): boolean {
  return !!date && date.startsWith(`${year}-`);
}

/** A stored instant read as SAST wall-clock, the zone the schedule is kept in. */
function sast(value: unknown): { date: string; time: string } | null {
  const date =
    value instanceof Date ? value : value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const wall = new Date(date.getTime() + SAST_OFFSET_MINUTES * 60_000);
  return {
    date: `${wall.getUTCFullYear()}-${pad(wall.getUTCMonth() + 1)}-${pad(wall.getUTCDate())}`,
    time: `${pad(wall.getUTCHours())}:${pad(wall.getUTCMinutes())}`,
  };
}

/** Year bounds as instants, so a Mongo date range lines up with SAST days. */
function yearBounds(year: number): { from: Date; to: Date } {
  return {
    from: new Date(`${year}-01-01T00:00:00+02:00`),
    to: new Date(`${year + 1}-01-01T00:00:00+02:00`),
  };
}

function clockRange(start: unknown, end: unknown): string {
  // Wide enough for "9:00 AM" — events store a meridiem, training days "HH:MM".
  const from = text(start, 12);
  const to = text(end, 12);
  if (from && to) return `${from} - ${to}`;
  return from || to;
}

export function programItems(
  doc: ProgramCalendarDoc,
  scopeName: string,
  year: number,
): CalendarFeedItem[] {
  const items: CalendarFeedItem[] = [];
  for (const entry of doc.entries) {
    if (!inYear(entry.date, year)) continue;
    items.push({
      id: `program-${doc.clubSlug}-${entry.id}`,
      source: "program",
      kind: "Programme",
      title: entry.title,
      date: entry.date,
      ...(entry.endDate ? { endDate: entry.endDate } : {}),
      ...(entry.time ? { time: entry.time } : {}),
      ...(entry.location ? { location: entry.location } : {}),
      ...(entry.description ? { description: entry.description } : {}),
      ...(entry.term ? { term: entry.term } : {}),
      ...(entry.setting ? { setting: entry.setting } : {}),
      scope: doc.clubSlug,
      scopeName,
      refId: entry.id,
    });
  }
  return items;
}

export function eventItems(
  doc: any,
  scopeName: string,
  year: number,
): CalendarFeedItem[] {
  const date = isoDate(doc?.date);
  if (!inYear(date, year)) return [];
  const refId = String(doc._id);
  const endDate = isoDate(doc?.dateTo);
  const time = clockRange(doc?.time, doc?.timeTo);
  return [
    {
      id: `event-${refId}`,
      source: "event",
      kind: text(doc?.category, 24) || "Event",
      title: text(doc?.title, 160) || "Event",
      date,
      ...(endDate && endDate > date ? { endDate } : {}),
      ...(time ? { time } : {}),
      ...(text(doc?.location, 160) ? { location: text(doc.location, 160) } : {}),
      ...(text(doc?.description, 600) ? { description: text(doc.description, 600) } : {}),
      scope: text(doc?.clubSlug, 40).toLowerCase() || ORGANIZATION_SCOPE,
      scopeName,
      refId,
    },
  ];
}

export function boardItems(doc: any, year: number): CalendarFeedItem[] {
  const when = sast(doc?.scheduledDate);
  if (!when || !inYear(when.date, year)) return [];
  // A cancelled meeting never runs, so it has no place on the agenda.
  if (doc?.status === "CANCELLED") return [];
  const refId = String(doc._id);
  return [
    {
      id: `board-${refId}`,
      source: "board",
      kind: "Board meeting",
      title: text(doc?.title, 160) || "Board meeting",
      date: when.date,
      time: when.time,
      ...(text(doc?.location, 160) ? { location: text(doc.location, 160) } : {}),
      scope: ORGANIZATION_SCOPE,
      scopeName: ORGANIZATION_CALENDAR_NAME,
      refId,
    },
  ];
}

export function trainingItems(doc: any, year: number): CalendarFeedItem[] {
  const refId = String(doc._id);
  const base = {
    source: "training" as const,
    kind: "Training",
    title: text(doc?.title, 160) || "Training",
    ...(text(doc?.location, 160) ? { location: text(doc.location, 160) } : {}),
    scope: ORGANIZATION_SCOPE,
    scopeName: ORGANIZATION_CALENDAR_NAME,
    refId,
  };

  const days: CalendarFeedItem[] = [];
  const rawDays = Array.isArray(doc?.days) ? doc.days : [];
  for (let index = 0; index < rawDays.length; index++) {
    const day = rawDays[index];
    const date = isoDate(day?.date);
    if (!inYear(date, year)) continue;
    const time = clockRange(day?.startTime, day?.endTime);
    const description =
      [text(day?.topic, 200), text(day?.details, 600)].filter(Boolean).join(" — ") ||
      text(doc?.description, 600);
    days.push({
      ...base,
      id: `training-${refId}-d${index}`,
      date,
      ...(time ? { time } : {}),
      ...(description ? { description } : {}),
    });
  }
  if (days.length) return days;

  // Older trainings carry no day plan; their start instant is the whole record.
  const when = sast(doc?.scheduledDate);
  if (!when || !inYear(when.date, year)) return [];
  const description = text(doc?.description, 600);
  return [
    {
      ...base,
      id: `training-${refId}`,
      date: when.date,
      time: when.time,
      ...(description ? { description } : {}),
    },
  ];
}

/** Untimed dates lead their day, then timed ones in clock order. */
function startMinutes(time?: string): number {
  const range = parseTimeRange(time);
  return range ? range.start.hours * 60 + range.start.minutes : -1;
}

export function sortFeedItems(items: CalendarFeedItem[]): CalendarFeedItem[] {
  return [...items].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      startMinutes(a.time) - startMinutes(b.time) ||
      a.title.localeCompare(b.title),
  );
}

/** Organization-wide events store no club, which Mongo reads back as null. */
function eventScopeFilter(scope: string): Record<string, unknown> {
  if (scope === ALL_SCOPES) return {};
  if (scope === ORGANIZATION_SCOPE) return { clubSlug: { $in: [null, ""] } };
  return { clubSlug: scope };
}

export type FeedQuery = { year: number; scope: string; isAdmin: boolean };

export async function buildCalendarFeed(
  db: Db,
  { year, scope, isAdmin }: FeedQuery,
): Promise<CalendarFeed> {
  const clubSlug =
    scope === ALL_SCOPES || scope === ORGANIZATION_SCOPE ? undefined : scope;
  // Board meetings and trainings belong to the organization, so a club filter
  // must not pull them in — and a member never reads those collections at all.
  const includeGovernance = isAdmin && !clubSlug;
  const { from, to } = yearBounds(year);

  const [clubs, calendars, events, meetings, trainings, programmeYears] =
    await Promise.all([
      listAllClubs(db),
      listCalendars(db, year),
      db
        .collection("community_events")
        .find(
          {
            date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
            ...eventScopeFilter(scope),
          },
          { projection: EVENT_FIELDS },
        )
        .limit(500)
        .toArray(),
      includeGovernance
        ? db
            .collection("board_meetings")
            .find(
              { scheduledDate: { $gte: from, $lt: to }, status: { $ne: "CANCELLED" } },
              { projection: MEETING_FIELDS },
            )
            .limit(200)
            .toArray()
        : Promise.resolve([]),
      includeGovernance
        ? db
            .collection("trainings")
            .find(
              {
                $or: [
                  { "days.date": { $gte: `${year}-01-01`, $lte: `${year}-12-31` } },
                  { scheduledDate: { $gte: from, $lt: to } },
                ],
              },
              { projection: TRAINING_FIELDS },
            )
            .limit(200)
            .toArray()
        : Promise.resolve([]),
      listCalendarYears(db, clubSlug),
    ]);

  const names = new Map(clubs.map((club) => [club.slug, club.name]));
  const nameOf = (slug: string) =>
    slug === ORGANIZATION_SCOPE
      ? ORGANIZATION_CALENDAR_NAME
      : names.get(slug) || slug;

  const items: CalendarFeedItem[] = [];
  for (const calendar of calendars) {
    if (scope !== ALL_SCOPES && calendar.clubSlug !== scope) continue;
    items.push(...programItems(calendar, nameOf(calendar.clubSlug), year));
  }
  for (const event of events) {
    const slug = text(event.clubSlug, 40).toLowerCase() || ORGANIZATION_SCOPE;
    items.push(...eventItems(event, nameOf(slug), year));
  }
  for (const meeting of meetings) items.push(...boardItems(meeting, year));
  for (const training of trainings) items.push(...trainingItems(training, year));

  return {
    year,
    scope,
    scopeName: scope === ALL_SCOPES ? ORGANIZATION_CALENDAR_NAME : nameOf(scope),
    isAdmin,
    programmeYears,
    items: sortFeedItems(items),
  };
}

/**
 * The phone-calendar file covers the shared calendar only. Board meetings and
 * trainings stay in the app: the export is opened in the device browser, which
 * carries no app session, so an admin-only row could never be fetched there.
 */
export function icsEntries(items: CalendarFeedItem[]) {
  return items
    .filter((item) => item.source === "program" || item.source === "event")
    .map((item) => ({
      id: item.id,
      date: item.date,
      ...(item.endDate ? { endDate: item.endDate } : {}),
      title: item.title,
      ...(item.description ? { description: item.description } : {}),
      ...(item.time ? { time: item.time } : {}),
      ...(item.location ? { location: item.location } : {}),
      term: item.kind,
      setting: item.scopeName,
    }));
}