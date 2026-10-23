/**
 * Shared club-services definitions — the member services marketplace.
 *
 * Admins post services (bug fixes, designs, other deliverables); signed-in
 * members claim one at a time and submit their work for admin review.
 *
 * Kept in lib/ because route handlers are separate entrypoints and cross-
 * route imports don't resolve.
 */

export const SERVICE_TYPES = ["bug", "design", "other"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_STATUSES = [
  "open",
  "accepted",
  "submitted",
  "approved",
  "closed",
] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export type ServiceSubmission = {
  note: string;
  githubLink: string | null;
  imageUrl: string | null;
  submittedAt: Date;
};

export type ServiceReview = {
  approved: boolean;
  note: string | null;
  reviewedBy: string;
  reviewedAt: Date;
};

export type ClubService = {
  _id?: any;
  title: string;
  description: string;
  type: ServiceType;
  clubSlug: string | null;
  posterId: string;
  posterName: string;
  status: ServiceStatus;
  acceptedById: string | null;
  acceptedByName: string | null;
  acceptedAt: Date | null;
  /** Optional target date for the work ("due by"). */
  dueDate: Date | null;
  submission: ServiceSubmission | null;
  review: ServiceReview | null;
  createdAt: Date;
  updatedAt: Date;
};

export const CLUB_SERVICES_COLLECTION = "club_services";

/** GitHub / commit / PR links must be plain http(s) so they open in-app. */
export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Accepts "YYYY-MM-DD" or any Date-parsable string; returns null for empty
 * or invalid input so a bad date never blocks posting.
 */
export function parseDueDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value.trim());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * A submission must carry the deliverable its service type asks for:
 * bug fixes link the PR/commit, designs attach the rendered image.
 */
export function validateSubmission(
  type: ServiceType,
  input: { githubLink?: string | null; imageUrl?: string | null },
): string | null {
  if (type === "bug" && !isHttpUrl(input.githubLink)) {
    return "A GitHub PR or commit link is required for bug fixes.";
  }
  if (type === "design" && !isHttpUrl(input.imageUrl)) {
    return "An image upload is required for design work.";
  }
  if (type === "other" && !isHttpUrl(input.githubLink) && !isHttpUrl(input.imageUrl)) {
    return "Attach your deliverable — a link or an image.";
  }
  return null;
}

export function serializeService(doc: any) {
  if (!doc) return doc;
  return { ...doc, _id: doc._id?.toString?.() ?? doc._id };
}
