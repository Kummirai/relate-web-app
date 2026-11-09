import { randomUUID } from "crypto";
import { sendBoardEmails } from "./mailer";
import { sendPushNotifications } from "./push";

/**
 * Board governance domain: meetings, attendance RSVPs, minutes and action
 * items. Board members are admin users — the governance portal lives inside
 * the admin console, so "the board" is whoever holds the admin role.
 */

export const RSVP_STATUSES = ["ATTENDING", "APOLOGY", "PENDING"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export const MEETING_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED"] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const MINUTES_WINDOW_HOURS = 48;
const HOUR_MS = 60 * 60 * 1000;

export type BoardMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type BoardRsvp = {
  userId: string;
  name: string;
  role: string;
  status: RsvpStatus;
};

export type BoardMeeting = {
  _id: string;
  title: string;
  scheduledDate: string | null;
  location: string;
  agenda: string[];
  rsvps: BoardRsvp[];
  status: MeetingStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

export type BoardActionItem = {
  taskId: string;
  assigneeId: string;
  assigneeName: string;
  taskDescription: string;
  dueDate: string | null;
  status: TaskStatus;
};

export type BoardMinutes = {
  _id: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string | null;
  publishedBy: string;
  publishedByName: string;
  publishedAt: string | null;
  hoursAfterMeeting: number | null;
  within48h: boolean;
  summary: string;
  minutesDocumentUrl: string;
  actionItems: BoardActionItem[];
  createdAt: string | null;
  updatedAt: string | null;
};

export function isRsvpStatus(value: unknown): value is RsvpStatus {
  return typeof value === "string" && (RSVP_STATUSES as readonly string[]).includes(value);
}

export function isMeetingStatus(value: unknown): value is MeetingStatus {
  return typeof value === "string" && (MEETING_STATUSES as readonly string[]).includes(value);
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (TASK_STATUSES as readonly string[]).includes(value);
}

export function pickText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function iso(value: unknown): string | null {
  const date = parseDate(value);
  return date ? date.toISOString() : null;
}

export function isObjectIdString(value: unknown): boolean {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);
}

export function sanitizeAgenda(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => pickText(entry, 240))
    .filter(Boolean)
    .slice(0, 30);
}

/** The board roster: every active admin, newest listing fields only. */
export async function listBoardMembers(db: any): Promise<BoardMember[]> {
  const docs = await db
    .collection("user")
    .find({ role: "admin" })
    .project({ id: 1, _id: 1, name: 1, email: 1, role: 1 })
    .sort({ name: 1 })
    .toArray();

  return docs
    .map((u: any) => ({
      id: String(u.id || u._id?.toString() || ""),
      name: u.name || "Board member",
      email: u.email || "",
      role: u.role || "admin",
    }))
    .filter((m: BoardMember) => !!m.id);
}

export function rsvpCounts(rsvps: BoardRsvp[]) {
  return {
    attending: rsvps.filter((r) => r.status === "ATTENDING").length,
    apologies: rsvps.filter((r) => r.status === "APOLOGY").length,
    pending: rsvps.filter((r) => r.status === "PENDING").length,
    total: rsvps.length,
  };
}

export function serializeMeeting(doc: any) {
  const rsvps: BoardRsvp[] = Array.isArray(doc?.rsvps)
    ? doc.rsvps.map((r: any) => ({
        userId: String(r.userId || ""),
        name: r.name || "Board member",
        role: r.role || "admin",
        status: isRsvpStatus(r.status) ? r.status : "PENDING",
      }))
    : [];

  return {
    _id: doc._id.toString(),
    title: doc.title || "Board meeting",
    scheduledDate: iso(doc.scheduledDate),
    location: doc.location || "",
    agenda: Array.isArray(doc.agenda) ? doc.agenda : [],
    rsvps,
    status: isMeetingStatus(doc.status) ? doc.status : "SCHEDULED",
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
    counts: rsvpCounts(rsvps),
  };
}

export function taskCounts(items: BoardActionItem[]) {
  return {
    pending: items.filter((t) => t.status === "PENDING").length,
    inProgress: items.filter((t) => t.status === "IN_PROGRESS").length,
    done: items.filter((t) => t.status === "DONE").length,
    total: items.length,
  };
}

export function serializeMinutes(doc: any) {
  const actionItems: BoardActionItem[] = Array.isArray(doc?.actionItems)
    ? doc.actionItems.map((t: any) => ({
        taskId: String(t.taskId || ""),
        assigneeId: String(t.assigneeId || ""),
        assigneeName: t.assigneeName || "Board member",
        taskDescription: t.taskDescription || "",
        dueDate: iso(t.dueDate),
        status: isTaskStatus(t.status) ? t.status : "PENDING",
      }))
    : [];

  return {
    _id: doc._id.toString(),
    meetingId: String(doc.meetingId || ""),
    meetingTitle: doc.meetingTitle || "Board meeting",
    meetingDate: iso(doc.meetingDate),
    publishedBy: String(doc.publishedBy || ""),
    publishedByName: doc.publishedByName || "Secretary",
    publishedAt: iso(doc.publishedAt),
    hoursAfterMeeting:
      typeof doc.hoursAfterMeeting === "number" ? doc.hoursAfterMeeting : null,
    within48h: doc.within48h !== false,
    summary: doc.summary || "",
    minutesDocumentUrl: doc.minutesDocumentUrl || "",
    actionItems,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
    counts: taskCounts(actionItems),
  };
}

/**
 * The 48-hour rule: minutes should be logged within two days of the meeting.
 * Late logs are accepted (never lost) but flagged so the archive can show
 * compliance rather than silently letting the deadline pass.
 */
export function minutesWindow(meetingDate: Date, publishedAt: Date) {
  const hours = Math.max(0, (publishedAt.getTime() - meetingDate.getTime()) / HOUR_MS);
  const rounded = Math.round(hours * 10) / 10;
  return {
    hoursAfterMeeting: rounded,
    within48h: rounded <= MINUTES_WINDOW_HOURS,
  };
}

export function applyAttendance(
  rsvps: BoardRsvp[],
  raw: unknown,
): BoardRsvp[] {
  const updates = new Map<string, RsvpStatus>();
  for (const entry of Array.isArray(raw) ? raw : []) {
    const userId = pickText((entry as any)?.userId, 64);
    const status = (entry as any)?.status;
    if (userId && (status === "ATTENDING" || status === "APOLOGY")) {
      updates.set(userId, status);
    }
  }
  return rsvps.map((rsvp) =>
    updates.has(rsvp.userId)
      ? { ...rsvp, status: updates.get(rsvp.userId) as RsvpStatus }
      : rsvp,
  );
}

export function sanitizeActionItems(
  raw: unknown,
  members: BoardMember[],
): BoardActionItem[] {
  const roster = new Map(members.map((m) => [m.id, m]));
  const items: BoardActionItem[] = [];
  for (const entry of Array.isArray(raw) ? raw : []) {
    const description = pickText((entry as any)?.taskDescription, 600);
    const assignee = roster.get(pickText((entry as any)?.assigneeId, 64));
    if (!description || !assignee) continue;
    const dueDate = parseDate((entry as any)?.dueDate);
    items.push({
      taskId: randomUUID(),
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      taskDescription: description,
      dueDate: dueDate ? dueDate.toISOString() : null,
      status: "PENDING",
    });
    if (items.length >= 50) break;
  }
  return items;
}

export function formatBoardDate(value: Date | string | null): string {
  const date = parseDate(value);
  if (!date) return "Date to be confirmed";
  return date.toLocaleString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  });
}

export type BoardNotice = {
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  email?: { subject: string; paragraphs: string[] };
};

/**
 * In-app notification, push and (when configured) email for a set of board
 * members. Never throws: the meeting/minutes write must stand on its own.
 */
export async function notifyBoardMembers(
  db: any,
  members: BoardMember[],
  notice: BoardNotice,
  exceptUserId?: string | null,
) {
  const targets = members.filter((m) => m.id && m.id !== exceptUserId);
  if (!targets.length) return;

  try {
    const now = new Date();
    await db.collection("notifications").insertMany(
      targets.map((member) => ({
        userId: member.id,
        type: notice.type,
        title: notice.title,
        body: notice.body,
        data: notice.data || {},
        read: false,
        createdAt: now,
      })),
    );
  } catch (e) {
    console.error("[board] in-app notification failed", e);
  }

  try {
    const tokens = await db
      .collection("push_tokens")
      .find({ userId: { $in: targets.map((m) => m.id) } })
      .toArray();
    await sendPushNotifications(
      tokens.map((t: any) => t.token).filter(Boolean),
      notice.title,
      notice.body,
      { type: notice.type, ...(notice.data || {}) },
    );
  } catch (e) {
    console.error("[board] push notification failed", e);
  }

  if (notice.email) {
    try {
      await sendBoardEmails(
        targets,
        notice.email.subject,
        notice.email.paragraphs,
      );
    } catch (e) {
      console.error("[board] email notification failed", e);
    }
  }
}

/** Single-user in-app + push nudge (e.g. an action item assigned). */
export async function notifyBoardMember(
  db: any,
  member: BoardMember,
  notice: BoardNotice,
) {
  await notifyBoardMembers(db, [member], notice);
}
