import { parseDate } from "./board-governance";

/**
 * Officer and position training sessions. The board (admin users) is the
 * audience: only admins list trainings and only admins are notified.
 */

export type Training = {
  _id: string;
  title: string;
  description: string;
  scheduledDate: string | null;
  location: string;
  imageUrl: string;
  createdByName: string;
  createdAt: string | null;
  updatedAt: string | null;
};

function iso(value: unknown): string | null {
  const date = parseDate(value);
  return date ? date.toISOString() : null;
}

export function serializeTraining(doc: any): Training {
  return {
    _id: doc._id.toString(),
    title: doc.title || "Training",
    description: doc.description || "",
    scheduledDate: iso(doc.scheduledDate),
    location: doc.location || "",
    imageUrl: doc.imageUrl || "",
    createdByName: doc.createdByName || "Board Secretary",
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}
