/**
 * iCalendar (RFC 5545) export for a program calendar, so a member can drop the
 * whole year — or one entry — into the calendar app on their phone.
 *
 * Entries carry a free-text `time` ("10:00 AM", "9:00 - 13:00", "Morning").
 * When it parses to a clock the event is timed in the organization's zone;
 * otherwise it is exported as an all-day event, which is what an untimed
 * program date actually means.
 */

import type { CalendarEntry } from "./program-calendar";

/** The organization keeps its schedule in SAST — a fixed +0200, never DST. */
export const CALENDAR_TIMEZONE = "Africa/Johannesburg";

const UID_DOMAIN = "relateworld.org";
const DEFAULT_DURATION_MINUTES = 60;

type Clock = { hours: number; minutes: number };

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

/** YYYY-MM-DD shifted by `days`, still ISO. UTC keeps the date from drifting. */
function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** YYYY-MM-DD → YYYYMMDD. */
function compactDate(iso: string): string {
  return iso.replace(/-/g, "");
}

function compactDateTime(iso: string, clock: Clock): string {
  return `${compactDate(iso)}T${pad(clock.hours)}${pad(clock.minutes)}00`;
}

function addMinutes(clock: Clock, minutes: number): Clock {
  const total = (clock.hours * 60 + clock.minutes + minutes) % (24 * 60);
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

function parseClock(raw: string): Clock | null {
  const match = /^\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*$/i.exec(raw);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  if (minutes > 59) return null;
  const meridiem = match[3]?.toLowerCase().replace(/\./g, "");
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === "pm" && hours !== 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
  } else if (hours > 23) {
    return null;
  }
  return { hours, minutes };
}

/** Best-effort read of the free-text time field. Null means "all day". */
export function parseTimeRange(
  raw?: string,
): { start: Clock; end: Clock | null } | null {
  if (!raw || !raw.trim()) return null;
  const parts = raw.split(/\s*(?:-|–|—|to)\s*/i).filter((p) => p.trim());
  const start = parseClock(parts[0] ?? "");
  if (!start) return null;
  const end = parts.length > 1 ? parseClock(parts[1]) : null;
  return { start, end };
}

/** TEXT values escape backslash, semicolon, comma and newline (RFC 5545 3.3.11). */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * Fold to 75 octets, continuing with a single space. Counts bytes rather than
 * characters so a multi-byte glyph is never cut in half.
 */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const out: string[] = [];
  let current = "";
  let budget = 75;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (size > budget) {
      out.push(current);
      current = "";
      // A continuation line spends one octet on its leading space.
      budget = 74;
    }
    current += char;
    budget -= size;
  }
  if (current) out.push(current);
  return out.join("\r\n ");
}

function property(name: string, value: string): string {
  return foldLine(`${name}:${escapeText(value)}`);
}

function utcStamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${CALENDAR_TIMEZONE}`,
  "BEGIN:STANDARD",
  "DTSTART:19700101T000000",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0200",
  "TZNAME:SAST",
  "END:STANDARD",
  "END:VTIMEZONE",
];

function eventLines(
  entry: CalendarEntry,
  scope: string,
  year: number,
  stamp: string,
): string[] {
  const range = parseTimeRange(entry.time);
  const lastDate = entry.endDate && entry.endDate > entry.date ? entry.endDate : entry.date;
  const lines = ["BEGIN:VEVENT", `UID:${scope}-${year}-${entry.id}@${UID_DOMAIN}`, `DTSTAMP:${stamp}`];

  if (range) {
    lines.push(`DTSTART;TZID=${CALENDAR_TIMEZONE}:${compactDateTime(entry.date, range.start)}`);
    let endDate = lastDate;
    let endClock = range.end;
    if (!endClock) {
      endClock = addMinutes(range.start, DEFAULT_DURATION_MINUTES);
      const wraps =
        endClock.hours * 60 + endClock.minutes < range.start.hours * 60 + range.start.minutes;
      // A late start rolls the default hour into the next morning, but only
      // when the entry is a single day — a multi-day one already ends later.
      if (wraps && lastDate === entry.date) endDate = shiftDate(entry.date, 1);
    }
    lines.push(`DTEND;TZID=${CALENDAR_TIMEZONE}:${compactDateTime(endDate, endClock)}`);
    lines.push("TRANSP:OPAQUE");
  } else {
    lines.push(`DTSTART;VALUE=DATE:${compactDate(entry.date)}`);
    // All-day DTEND is exclusive, so a one-day entry ends the following date.
    lines.push(`DTEND;VALUE=DATE:${compactDate(shiftDate(lastDate, 1))}`);
    lines.push("TRANSP:TRANSPARENT");
  }

  lines.push(property("SUMMARY", entry.title));
  if (entry.description) lines.push(property("DESCRIPTION", entry.description));
  if (entry.location) lines.push(property("LOCATION", entry.location));
  const categories = [entry.term, entry.setting].filter(Boolean) as string[];
  // CATEGORIES is a list of TEXT values: escape each one, keep the commas bare.
  if (categories.length) {
    lines.push(foldLine(`CATEGORIES:${categories.map(escapeText).join(",")}`));
  }
  if (entry.time && !range) lines.push(property("X-RELATE-TIME", entry.time));
  lines.push("SEQUENCE:0", "STATUS:CONFIRMED", "END:VEVENT");
  return lines;
}

export type IcsOptions = {
  /** Display name of the exported calendar, e.g. "Relate" or a club name. */
  name: string;
  scope: string;
  year: number;
  entries: CalendarEntry[];
  /** Injected by tests so DTSTAMP is deterministic. */
  now?: Date;
};

/** A complete VCALENDAR, CRLF-terminated as the spec requires. */
export function buildCalendarIcs({ name, scope, year, entries, now }: IcsOptions): string {
  const stamp = utcStamp(now ?? new Date());
  const sorted = [...entries].sort(
    (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title),
  );
  const timed = sorted.some((entry) => parseTimeRange(entry.time));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Relate World//Program Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    property("X-WR-CALNAME", `${name} ${year}`),
    property("X-WR-CALDESC", `${name} program calendar for ${year}`),
    ...(timed ? VTIMEZONE : []),
    ...sorted.flatMap((entry) => eventLines(entry, scope, year, stamp)),
    "END:VCALENDAR",
  ];

  return lines.join("\r\n") + "\r\n";
}

/** Safe ASCII filename for the Content-Disposition header. */
export function icsFilename(scope: string, year: number): string {
  const safe = scope.replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "calendar";
  return `${safe}-${year}.ics`;
}