import { getDb } from "./mongodb.js";

const COLLECTION = "sessions";

export const SESSION_STATUS = ["confirmed", "cancelled", "completed"];

// getDay() -> tutor weekday key (monday-first availability shape)
const WEEKDAY_KEYS = [null, "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/**
 * Mongoose-free session document factory. A booking snapshot of the tutor
 * (name/image/subjects) is stored so the app's session list needs no per-tutor
 * lookups. Unknown input fields are dropped, so API writes can never inject
 * extra properties.
 */
export function createSession(data = {}) {
  const now = new Date();
  return {
    userId: data.userId ?? null,
    tutorId: data.tutorId ?? null,
    tutorName: data.tutorName ?? null,
    tutorImage: data.tutorImage ?? null,
    tutorSubjects: Array.isArray(data.tutorSubjects) ? data.tutorSubjects : [],
    club: data.club ?? null,
    subject: data.subject ?? null,
    topic: data.topic ?? null,
    grade: typeof data.grade === "number" ? data.grade : null,
    date: data.date ?? null,
    time: data.time ?? null,
    durationMin: typeof data.durationMin === "number" ? data.durationMin : 60,
    notes: data.notes ?? null,
    status: SESSION_STATUS.includes(data.status) ? data.status : "confirmed",
    createdAt: now,
    updatedAt: now,
    cancelledAt: data.cancelledAt ?? null,
  };
}

/**
 * True when a date/time string pair falls inside a tutor's weekly
 * availability. `availability` uses "HH:MM" 24-hour slot strings per weekday,
 * and a session date maps to the weekday it falls on.
 */
export function slotInAvailability(availability, date, time) {
  const day = new Date(`${date}T00:00:00`);
  if (isNaN(day.getTime())) return false;
  const key = WEEKDAY_KEYS[day.getDay()];
  if (!key) return false;
  const slots = availability?.[key];
  return Array.isArray(slots) && slots.includes(time);
}

let sessionIndexesEnsured = false;

export async function ensureSessionIndexes() {
  if (sessionIndexesEnsured) return;
  sessionIndexesEnsured = true;
  try {
    const db = await getDb();
    const col = db.collection(COLLECTION);
    await Promise.all([
      // One student per (tutor, date, time) slot while confirmed. Cancelling a
      // session removes it from this partial index, freeing the slot again.
      col.createIndex(
        { tutorId: 1, date: 1, time: 1 },
        { unique: true, partialFilterExpression: { status: "confirmed" } },
      ),
      col.createIndex({ userId: 1, status: 1, date: 1, time: 1 }),
    ]);
  } catch {}
}