import { getDb } from "./mongodb.js";

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

export function createSponsorship(data = {}) {
  const now = new Date();
  return {
    sponsorId: data.sponsorId,
    name: data.name ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    amount: data.amount ?? 0,
    popUrl: data.popUrl ?? null,
    status: data.status ?? "pledged",
    createdAt: now,
  };
}

let sponsorshipIndexesEnsured = false;

export async function ensureSponsorshipIndexes() {
  if (sponsorshipIndexesEnsured) return;
  sponsorshipIndexesEnsured = true;
  try {
    const db = await getDb();
    await db
      .collection("sponsorships")
      .createIndex({ sponsorId: 1 }, { unique: true });
    await db.collection("sponsorships").createIndex({ createdAt: -1 });
  } catch {}
}
