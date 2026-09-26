/**
 * Shared volunteer-request definitions.
 *
 * Kept in lib/ rather than imported across route files, because route
 * handlers are separate entrypoints and cross-route imports don't resolve.
 */

export const VOLUNTEER_STATUSES = [
  "new",
  "reviewing",
  "contacted",
  "active",
  "declined",
] as const;

export type VolunteerStatus = (typeof VOLUNTEER_STATUSES)[number];

/** Areas a volunteer can apply to serve in. Mirrors the /volunteer page. */
export const VOLUNTEER_AREAS = [
  "Club Facilitation",
  "Children's Clubs",
  "Sports Coaching",
  "Season Guides & Content",
  "Education",
  "Prayer & Community Groups",
  "Photography & Design",
  "Social Media",
  "Website & IT",
  "Events & Logistics",
  "Admin & Data",
] as const;

export const VOLUNTEER_COLLECTION = "volunteer_requests";

export function ensureVolunteerIndexes(db: any) {
  return Promise.all([
    db.collection(VOLUNTEER_COLLECTION).createIndex({ createdAt: -1 }),
    db.collection(VOLUNTEER_COLLECTION).createIndex({ status: 1, createdAt: -1 }),
    db.collection(VOLUNTEER_COLLECTION).createIndex({ email: 1 }),
  ]);
}

export function serializeVolunteer(doc: any) {
  return { ...doc, _id: doc._id.toString() };
}
