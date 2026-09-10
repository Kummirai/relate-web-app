/**
 * Pure display helpers for the public magazine pages.
 * No React, no server-only imports — safe to use anywhere.
 */

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function shortWeekday(iso: string | undefined): string {
  if (!iso) return "";
  const d = parseISO(iso);
  if (isNaN(d.getTime())) return "";
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
}

export function formatDayHeader(iso: string | undefined): string {
  if (!iso) return "";
  const d = parseISO(iso);
  if (isNaN(d.getTime())) return iso;
  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getUTCDay()];
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  return `${dayName} · ${month} ${d.getUTCDate()}`;
}

/** e.g. "1 – 7 Sep" or cross-month "30 Sep – 6 Oct". */
export function formatWeekRange(startIso: string, endIso: string): string {
  const s = parseISO(startIso);
  const e = parseISO(endIso);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return "";
  const sMonth = s.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const eMonth = e.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const sameMonth = s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear();
  const start = sameMonth ? `${s.getUTCDate()}` : `${s.getUTCDate()} ${sMonth}`;
  return `${start} – ${e.getUTCDate()} ${eMonth}`;
}

export function fullDateLabel(iso: string | undefined): string {
  if (!iso) return "";
  const d = parseISO(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function coverGradient(theme?: string): string {
  const gradients = [
    "linear-gradient(150deg, #14532d 0%, #166534 55%, #15803d 100%)",
    "linear-gradient(150deg, #15803d 0%, #14532d 60%, #151f3a 100%)",
    "linear-gradient(150deg, #166534 0%, #14532d 45%, #15803d 120%)",
  ];
  let idx = 0;
  if (theme) {
    for (const ch of theme) idx = (idx + ch.charCodeAt(0)) % gradients.length;
  }
  return gradients[idx];
}