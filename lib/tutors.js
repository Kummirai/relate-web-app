import { getDb } from "./mongodb.js";

const COLLECTION = "tutors";

export const TUTOR_DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/** Empty per-weekday availability used as the default for every tutor. */
export function emptyAvailability() {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };
}

/**
 * Grade bands map to clubs: 1–8 is Sprout, 9–12 is Surge.
 * A tutor with bands on both sides is listed in both clubs.
 */
export function tutorClubs(gradeRanges) {
  const clubs = new Set();
  for (const range of gradeRanges || []) {
    const bounds = String(range)
      .split(/[–—\-–]/, 2)
      .map((s) => parseInt(s.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const min = bounds.length > 0 ? bounds[0] : (bounds[1] ?? null);
    const max = bounds.length > 1 ? bounds[1] : min;
    if (min !== null && max !== null) {
      if (min <= 8) clubs.add("sprout");
      if (max >= 9) clubs.add("surge");
    }
  }
  return ["sprout", "surge"].filter((c) => clubs.has(c));
}

/**
 * Mongoose-free document factory: builds the tutor doc shape used by the
 * Homework Help frontend (plus `image`, `clubs`, timestamps). Unknown input
 * fields are dropped, so API writes can never inject extra properties.
 */
export function createTutor(data = {}) {
  const now = new Date();
  const availability = {
    ...emptyAvailability(),
    ...(data.availability ?? {}),
  };
  for (const key of TUTOR_DAY_KEYS) {
    if (!Array.isArray(availability[key])) availability[key] = [];
  }

  const gradeRanges = Array.isArray(data.gradeRanges) ? data.gradeRanges : [];

  return {
    id: data.id ?? null,
    name: data.name ?? null,
    email: data.email ?? null,
    image: data.image ?? null,
    subjects: Array.isArray(data.subjects) ? data.subjects : [],
    gradeRanges,
    clubs: Array.isArray(data.clubs) ? data.clubs : tutorClubs(gradeRanges),
    bio: data.bio ?? null,
    shortBio: data.shortBio ?? null,
    rating: typeof data.rating === "number" ? data.rating : 0,
    totalSessions: typeof data.totalSessions === "number" ? data.totalSessions : 0,
    responseTime: data.responseTime ?? null,
    availability,
    bookedSlots: Array.isArray(data.bookedSlots) ? data.bookedSlots : [],
    verified: data.verified === true,
    active: data.active !== false,
    createdAt: now,
    updatedAt: now,
  };
}

let tutorIndexesEnsured = false;

export async function ensureTutorIndexes() {
  if (tutorIndexesEnsured) return;
  tutorIndexesEnsured = true;
  try {
    const db = await getDb();
    await Promise.all([
      db.collection(COLLECTION).createIndex({ id: 1 }, { unique: true }),
      db.collection(COLLECTION).createIndex({ active: 1, rating: -1 }),
      db.collection(COLLECTION).createIndex({ clubs: 1, active: 1, rating: -1 }),
    ]);
  } catch {}
}