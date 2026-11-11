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
  reason: string;
};

/** An agenda line, optionally with lettered sub-points (1, 1a, 1b). */
export type AgendaItem = {
  text: string;
  subs: string[];
};

export type MinutesSection = {
  title: string;
  points: string[];
};

export type BoardMeeting = {
  _id: string;
  title: string;
  scheduledDate: string | null;
  location: string;
  agenda: AgendaItem[];
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
  sections: MinutesSection[];
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

function sanitizeSubs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => pickText(entry, 240))
    .filter(Boolean)
    .slice(0, 20);
}

/**
 * Accepts both the current `{ text, subs }` shape and the original plain
 * string lines, so meetings created before sub-points existed still load.
 */
export function sanitizeAgenda(value: unknown): AgendaItem[] {
  if (!Array.isArray(value)) return [];
  const items: AgendaItem[] = [];
  for (const entry of value.slice(0, 30)) {
    if (typeof entry === "string") {
      const text = pickText(entry, 240);
      if (text) items.push({ text, subs: [] });
      continue;
    }
    const text = pickText((entry as any)?.text, 240);
    if (!text) continue;
    items.push({ text, subs: sanitizeSubs((entry as any)?.subs) });
  }
  return items;
}

/** Read-side normalisation: old string agenda lines become items. */
export function serializeAgenda(value: unknown): AgendaItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry: any) =>
      typeof entry === "string"
        ? { text: entry, subs: [] as string[] }
        : {
            text: typeof entry?.text === "string" ? entry.text : "",
            subs: Array.isArray(entry?.subs)
              ? entry.subs.filter((sub: any) => typeof sub === "string" && sub)
              : [],
          },
    )
    .filter((item) => item.text);
}

export function sanitizeMinutesSections(value: unknown): MinutesSection[] {
  if (!Array.isArray(value)) return [];
  const sections: MinutesSection[] = [];
  for (const entry of value.slice(0, 30)) {
    const title = pickText((entry as any)?.title, 160);
    const points = Array.isArray((entry as any)?.points)
      ? (entry as any).points
          .map((point: any) => pickText(point, 2000))
          .filter(Boolean)
          .slice(0, 40)
      : [];
    if (!title && !points.length) continue;
    sections.push({ title: title || "Notes", points });
  }
  return sections;
}

/** The flat summary stays in sync so search, emails and old clients keep working. */
export function composeMinutesSummary(sections: MinutesSection[]): string {
  return sections
    .map((section) =>
      [section.title, ...section.points.map((point) => `• ${point}`)]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n")
    .slice(0, 20000);
}

/** Numbered agenda lines for notification emails: 1., a., b. */
export function agendaEmailLines(agenda: AgendaItem[]): string[] {
  return agenda.flatMap((item, index) => [
    `${index + 1}. ${item.text}`,
    ...item.subs.map(
      (sub, subIndex) => `   ${String.fromCharCode(97 + subIndex)}. ${sub}`,
    ),
  ]);
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

/** List-card shape — no agenda or attendee list; open the meeting for those. */
export function serializeMeetingCard(doc: any) {
  return {
    _id: doc._id.toString(),
    title: doc.title || "Board meeting",
    scheduledDate: iso(doc.scheduledDate),
    location: doc.location || "",
    status: isMeetingStatus(doc.status) ? doc.status : "SCHEDULED",
  };
}

export function serializeMeeting(doc: any) {
  const rsvps: BoardRsvp[] = Array.isArray(doc?.rsvps)
    ? doc.rsvps.map((r: any) => ({
        userId: String(r.userId || ""),
        name: r.name || "Board member",
        role: r.role || "admin",
        status: isRsvpStatus(r.status) ? r.status : "PENDING",
        reason: pickText(r.reason, 300),
      }))
    : [];

  return {
    _id: doc._id.toString(),
    title: doc.title || "Board meeting",
    scheduledDate: iso(doc.scheduledDate),
    location: doc.location || "",
    agenda: serializeAgenda(doc.agenda),
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
    sections: sanitizeMinutesSections(doc.sections),
    minutesDocumentUrl: doc.minutesDocumentUrl || "",
    actionItems,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
    counts: taskCounts(actionItems),
  };
}

/**
 * List-card shape for the minutes archive: enough to show a titled card with
 * its dates without shipping every section, point and task for the whole year.
 */
export function serializeMinutesSummary(doc: any) {
  const rawItems = Array.isArray(doc?.actionItems) ? doc.actionItems : [];
  const total = rawItems.length;
  const done = rawItems.filter((t: any) => t?.status === "DONE").length;
  return {
    _id: doc._id.toString(),
    meetingId: String(doc.meetingId || ""),
    meetingTitle: doc.meetingTitle || "Board meeting",
    meetingDate: iso(doc.meetingDate),
    publishedBy: String(doc.publishedBy || ""),
    publishedByName: doc.publishedByName || "Secretary",
    publishedAt: iso(doc.publishedAt),
    within48h: doc.within48h !== false,
    counts: { total, done, open: total - done },
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

type AttendanceUpdate = {
  status: "ATTENDING" | "APOLOGY";
  /** null means the register did not send a reason, so keep the existing one. */
  reason: string | null;
};

export function applyAttendance(
  rsvps: BoardRsvp[],
  raw: unknown,
): BoardRsvp[] {
  const updates = new Map<string, AttendanceUpdate>();
  for (const entry of Array.isArray(raw) ? raw : []) {
    const userId = pickText((entry as any)?.userId, 64);
    const status = (entry as any)?.status;
    if (userId && (status === "ATTENDING" || status === "APOLOGY")) {
      updates.set(userId, {
        status,
        reason:
          typeof (entry as any)?.reason === "string"
            ? pickText((entry as any).reason, 300)
            : null,
      });
    }
  }
  return rsvps.map((rsvp) => {
    const update = updates.get(rsvp.userId);
    if (!update) return rsvp;
    if (update.status === "ATTENDING") {
      return { ...rsvp, status: update.status, reason: "" };
    }
    return {
      ...rsvp,
      status: update.status,
      ...(update.reason !== null ? { reason: update.reason } : {}),
    };
  });
}

export function sanitizeActionItems(
  raw: unknown,
  members: BoardMember[],
): BoardActionItem[] {
  return mergeActionItems(raw, members, []);
}

/** Editing minutes keeps each task's id and progress; new rows start pending. */
export function mergeActionItems(
  raw: unknown,
  members: BoardMember[],
  existing: BoardActionItem[],
): BoardActionItem[] {
  const roster = new Map(members.map((m) => [m.id, m]));
  const prior = new Map(existing.map((item) => [item.taskId, item]));
  const items: BoardActionItem[] = [];
  for (const entry of Array.isArray(raw) ? raw : []) {
    const description = pickText((entry as any)?.taskDescription, 600);
    const assignee = roster.get(pickText((entry as any)?.assigneeId, 64));
    if (!description || !assignee) continue;
    const dueDate = parseDate((entry as any)?.dueDate);
    const previous = prior.get(pickText((entry as any)?.taskId, 64));
    items.push({
      taskId: previous ? previous.taskId : randomUUID(),
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      taskDescription: description,
      dueDate: dueDate ? dueDate.toISOString() : null,
      status: previous ? previous.status : "PENDING",
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
 *
 * The actor who triggered the change still gets the in-app record — the
 * notification centre doubles as the board's activity log, and on a small
 * board the actor can be the only admin online. Push and email stay with
 * everyone else so nobody buzzes their own phone.
 */
export async function notifyBoardMembers(
  db: any,
  members: BoardMember[],
  notice: BoardNotice,
  exceptUserId?: string | null,
) {
  if (!members.length) return;
  const targets = members.filter((m) => m.id);
  const remote = targets.filter((m) => m.id !== exceptUserId);
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

  if (!remote.length) return;

  try {
    const tokens = await db
      .collection("push_tokens")
      .find({ userId: { $in: remote.map((m) => m.id) } })
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
        remote,
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
