import { parseDate, sanitizeMeetingLink } from "./board-governance";

/**
 * Officer and position training sessions. The board (admin users) is the
 * audience: only admins list trainings and only admins are notified.
 *
 * A training can run over several days. Each day carries its own topic,
 * time range and notes, and every admin can mark whether they will attend.
 */

export type TrainingTimelineItem = {
  startTime: string;
  endTime: string;
  title: string;
  details: string;
};

export type TrainingDay = {
  date: string;
  topic: string;
  startTime: string;
  endTime: string;
  details: string;
  notes: string;
  timeline: TrainingTimelineItem[];
};

export const TRAINING_ATTENDANCE_STATUSES = ["ATTENDING", "NOT_ATTENDING"] as const;
export type TrainingAttendanceStatus = (typeof TRAINING_ATTENDANCE_STATUSES)[number];

export type TrainingAttendance = {
  userId: string;
  name: string;
  role: string;
  status: TrainingAttendanceStatus;
  reason: string;
};

export type Training = {
  _id: string;
  title: string;
  description: string;
  scheduledDate: string | null;
  location: string;
  meetingLink: string;
  imageUrl: string;
  days: TrainingDay[];
  attendance: TrainingAttendance[];
  counts: { attending: number; notAttending: number; total: number };
  createdBy: string;
  createdByName: string;
  createdAt: string | null;
  updatedAt: string | null;
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY = /^([01]\d|2[0-3]):[0-5]\d$/;
export const MAX_TRAINING_DAYS = 60;
const MAX_TIMELINE_ITEMS = 30;

function iso(value: unknown): string | null {
  const date = parseDate(value);
  return date ? date.toISOString() : null;
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function dayDate(value: unknown): string {
  const candidate = text(value, 10);
  return DATE_ONLY.test(candidate) ? candidate : "";
}

function dayTime(value: unknown): string {
  const candidate = text(value, 5);
  return TIME_ONLY.test(candidate) ? candidate : "";
}

function sanitizeTimeline(value: unknown): TrainingTimelineItem[] {
  if (!Array.isArray(value)) return [];
  const items: TrainingTimelineItem[] = [];
  for (const entry of value.slice(0, MAX_TIMELINE_ITEMS)) {
    const item: TrainingTimelineItem = {
      startTime: dayTime((entry as any)?.startTime),
      endTime: dayTime((entry as any)?.endTime),
      title: text((entry as any)?.title, 200),
      details: text((entry as any)?.details, 2000),
    };
    if (item.startTime || item.endTime || item.title || item.details) {
      items.push(item);
    }
  }
  return items;
}

/** Stored day plans; empty rows are dropped so old trainings stay day-less. */
export function sanitizeTrainingDays(value: unknown): TrainingDay[] {
  if (!Array.isArray(value)) return [];
  const days: TrainingDay[] = [];
  for (const entry of value.slice(0, MAX_TRAINING_DAYS)) {
    const day: TrainingDay = {
      date: dayDate((entry as any)?.date),
      topic: text((entry as any)?.topic, 200),
      startTime: dayTime((entry as any)?.startTime),
      endTime: dayTime((entry as any)?.endTime),
      details: text((entry as any)?.details, 4000),
      notes: text((entry as any)?.notes, 4000),
      timeline: sanitizeTimeline((entry as any)?.timeline),
    };
    const hasContent =
      day.date ||
      day.topic ||
      day.startTime ||
      day.endTime ||
      day.details ||
      day.notes ||
      day.timeline.length;
    if (hasContent) days.push(day);
  }
  return days;
}

export function isTrainingAttendanceStatus(
  value: unknown,
): value is TrainingAttendanceStatus {
  return (
    typeof value === "string" &&
    (TRAINING_ATTENDANCE_STATUSES as readonly string[]).includes(value)
  );
}

function serializeAttendance(value: unknown): TrainingAttendance[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry: any) => ({
      userId: String(entry?.userId || ""),
      name: entry?.name || "Board member",
      role: entry?.role || "admin",
      status: isTrainingAttendanceStatus(entry?.status)
        ? entry.status
        : ("ATTENDING" as TrainingAttendanceStatus),
      reason: text(entry?.reason, 500),
    }))
    .filter((entry) => !!entry.userId);
}

export function attendanceCounts(attendance: TrainingAttendance[]) {
  return {
    attending: attendance.filter((entry) => entry.status === "ATTENDING").length,
    notAttending: attendance.filter((entry) => entry.status === "NOT_ATTENDING").length,
    total: attendance.length,
  };
}

export function serializeTraining(doc: any): Training {
  const days = sanitizeTrainingDays(doc?.days);
  const attendance = serializeAttendance(doc?.attendance);
  return {
    _id: doc._id.toString(),
    title: doc.title || "Training",
    description: doc.description || "",
    scheduledDate: iso(doc.scheduledDate),
    location: doc.location || "",
    meetingLink: sanitizeMeetingLink(doc.meetingLink),
    imageUrl: doc.imageUrl || "",
    days,
    attendance,
    counts: attendanceCounts(attendance),
    createdBy: String(doc.createdBy || ""),
    createdByName: doc.createdByName || "Board Secretary",
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

/** "Day 1 (Mon, 1 Dec) 09:00–12:00 — Topic" lines for notification emails. */
export function trainingDayLines(days: TrainingDay[]): string[] {
  return days.map((day, index) => {
    let dateLabel = day.date;
    if (DATE_ONLY.test(day.date)) {
      const [year, month, date] = day.date.split("-").map(Number);
      dateLabel = new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-ZA", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      });
    }
    const timeRange =
      day.startTime && day.endTime
        ? `${day.startTime}–${day.endTime}`
        : day.startTime || day.endTime;
    const head = [`Day ${index + 1}`, dateLabel && `(${dateLabel})`, timeRange]
      .filter(Boolean)
      .join(" ");
    const headline = day.topic ? `${head} — ${day.topic}` : head;
    return [
      headline,
      ...day.timeline.map((item) => {
        const itemRange =
          item.startTime && item.endTime
            ? `${item.startTime}–${item.endTime}`
            : item.startTime || item.endTime;
        const label = [itemRange, item.title].filter(Boolean).join(" ");
        return `   • ${label}${item.details ? ` — ${item.details}` : ""}`;
      }),
    ];
  }).flat();
}
