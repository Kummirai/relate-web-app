/**
 * Shared volunteer-office definitions — open club/ops positions admins post
 * and members apply to fill.
 *
 * Distinct from lib/volunteers.ts (the public website intake form); this is
 * the in-app "offices that are not filled" board.
 */

import { VOLUNTEER_AREAS } from "./volunteers";

export const OFFICE_STATUSES = ["open", "filled", "closed"] as const;
export type OfficeStatus = (typeof OFFICE_STATUSES)[number];

export const OFFICE_APPLICATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type OfficeApplicationStatus = (typeof OFFICE_APPLICATION_STATUSES)[number];

export type VolunteerOffice = {
  _id?: any;
  title: string;
  description: string;
  area: string | null;
  clubSlug: string | null;
  postedById: string;
  postedByName: string;
  status: OfficeStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type OfficeApplication = {
  _id?: any;
  officeId: string;
  officeTitle: string;
  userId: string;
  name: string;
  email: string | null;
  motivation: string;
  status: OfficeApplicationStatus;
  reviewNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
};

export const VOLUNTEER_OFFICES_COLLECTION = "volunteer_offices";
export const OFFICE_APPLICATIONS_COLLECTION = "volunteer_office_applications";

/** Free-form areas are allowed, but the curated list is the source of truth. */
export function normalizeArea(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return (VOLUNTEER_AREAS as readonly string[]).includes(trimmed)
    ? trimmed
    : trimmed;
}

export function serializeOffice(doc: any) {
  if (!doc) return doc;
  return { ...doc, _id: doc._id?.toString?.() ?? doc._id };
}

export function serializeApplication(doc: any) {
  if (!doc) return doc;
  return { ...doc, _id: doc._id?.toString?.() ?? doc._id, officeId: String(doc.officeId ?? "") };
}
