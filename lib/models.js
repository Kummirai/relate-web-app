import { getDb } from "./mongodb.js";

// ---------------------------------------------------------------------------
// Publications (magazines & bulletins)
// ---------------------------------------------------------------------------

let publicationIndexesEnsured = false;

export async function ensurePublicationIndexes() {
  if (publicationIndexesEnsured) return;
  publicationIndexesEnsured = true;
  try {
    const db = await getDb();
    await Promise.all([
      db.collection("publications").createIndex({ id: 1 }, { unique: true }),
      db.collection("publications").createIndex({ publishedAt: -1 }),
      db.collection("publications").createIndex({ clubSlug: 1, publishedAt: -1 }),
      db.collection("publications").createIndex({ status: 1, publishedAt: -1 }),
    ]);
  } catch {}
}

const COLLECTION = "familyrecords";

// ---------------------------------------------------------------------------
// Allowed values
// ---------------------------------------------------------------------------

export const ENUMS = {
  preferredContactMethod: ["WhatsApp", "Phone Call", "Email"],
  urgencyLevel: ["High", "Medium", "Low"],
  immediateNeeds: [
    "Food Assistance",
    "Shelter",
    "Utility Bills",
    "Clothing",
    "Medical/Hygiene",
    "Child Tuition",
    "Other",
  ],
  longTermNeeds: [
    "Employment",
    "Education",
    "Financial Literacy",
    "Housing",
    "Healthcare",
    "Social Services",
    "Other",
  ],
  status: ["Active", "Closed", "Draft"],
};

// ---------------------------------------------------------------------------
// Schema (document shape + defaults)
// ---------------------------------------------------------------------------

export function createFamilyRecord(data = {}) {
  const now = new Date();

  const doc = {
    recordId:
      data.recordId ??
      `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    dateOfIntake: data.dateOfIntake,
    caseManager: data.caseManager,
    headOfHousehold: data.headOfHousehold,
    contactNumber: data.contactNumber,
    alternateContactNumber: data.alternateContactNumber ?? null,
    emailAddress: data.emailAddress ?? null,
    physicalAddress: data.physicalAddress,
    preferredContactMethod: data.preferredContactMethod ?? [],
    householdMembers: (data.householdMembers ?? []).map((m) => ({
      name: m.name ?? null,
      age: m.age ?? null,
      relationship: m.relationship ?? null,
    })),
    summary: data.summary,
    urgencyLevel: data.urgencyLevel ?? "Medium",
    immediateNeeds: data.immediateNeeds ?? [],
    longTermNeeds: data.longTermNeeds ?? [],
    actionLog: (data.actionLog ?? []).map((e) => ({
      date: e.date ?? now,
      actionTaken: e.actionTaken ?? null,
      byWhom: e.byWhom ?? null,
      nextStep: e.nextStep ?? null,
      dueDate: e.dueDate ?? null,
    })),
    caseClosedDate: data.caseClosedDate ?? null,
    reasonForClosure: data.reasonForClosure ?? null,
    finalOutcome: data.finalOutcome ?? null,
    status: data.status ?? "Active",
    createdAt: now,
    updatedAt: now,
  };

  // Mirror the pre-save hook: auto-close if caseClosedDate is set
  if (doc.caseClosedDate) doc.status = "Closed";

  return doc;
}

// ---------------------------------------------------------------------------
// Index setup — call once at app startup
// ---------------------------------------------------------------------------

let familyIndexesEnsured = false;

export async function ensureFamilyRecordIndexes() {
  if (familyIndexesEnsured) return;
  familyIndexesEnsured = true;
  try {
    const db = await getDb();
    await db
      .collection(COLLECTION)
      .createIndex({ recordId: 1 }, { unique: true });
  } catch {}
}

// ---------------------------------------------------------------------------
// Sponsorships
// ---------------------------------------------------------------------------

/**
 * Sponsorship transaction.
 * Status lifecycle: "pending" (awaiting admin review) -> "approved" | "rejected".
 * Only approved sponsorships count towards reported income.
 */
export function createSponsorship(data = {}) {
  const now = new Date();
  return {
    sponsorId: data.sponsorId,
    name: data.name ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    amount: data.amount ?? 0,
    popUrl: data.popUrl ?? null,
    userId: data.userId ?? null,
    status: data.status ?? "pending",
    reviewedAt: data.reviewedAt ?? null,
    reviewedBy: data.reviewedBy ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

let sponsorshipIndexesEnsured = false;

export async function ensureSponsorshipIndexes() {
  if (sponsorshipIndexesEnsured) return;
  sponsorshipIndexesEnsured = true;
  try {
    const db = await getDb();
    // One-time migration: legacy statuses -> the approval workflow model.
    // "paid" (POP attached, never reviewed) becomes "approved" so history
    // isn't dropped from the report; "pledged" becomes "pending" (awaiting
    // admin review).
    await db
      .collection("sponsorships")
      .updateMany({ status: "paid" }, { $set: { status: "approved" } });
    await db
      .collection("sponsorships")
      .updateMany({ status: "pledged" }, { $set: { status: "pending" } });
    await Promise.all([
      db
        .collection("sponsorships")
        .createIndex({ sponsorId: 1 }, { unique: true }),
      db.collection("sponsorships").createIndex({ createdAt: -1 }),
      db.collection("sponsorships").createIndex({ status: 1, createdAt: -1 }),
      db.collection("sponsorships").createIndex({ userId: 1, createdAt: -1 }),
      // A user has exactly one stable sponsor ID, created on their first pledge.
      db
        .collection("user")
        .createIndex({ sponsorId: 1 }, { unique: true, sparse: true }),
    ]);
  } catch {}
}
