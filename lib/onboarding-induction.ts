export const ONBOARDING_COLLECTION = "onboarding_induction";
export const ONBOARDING_APPROVER_EMAIL = "ajaxmilton@hotmail.com";

const BOOLEAN_KEYS = [
  "foundApp",
  "installedApp",
  "createdAccount",
  "loggedIn",
  "canLoginAgain",
  "joinedClub",
  "joinedTeam",
  "foundTraining",
  "registeredAttendance",
  "readMinutes",
  "markedTaskComplete",
  "knowsWhoToAsk",
  "secretarySetupMeeting",
  "secretaryAddedMinutes",
  "secretaryCheckedAttendance",
  "secretaryTrackedTasks",
  "secretaryFoundOldMinutes",
  "treasurerStartedReport",
  "treasurerCheckedReport",
  "treasurerSharedReport",
  "treasurerKnowsCorrection",
  "treasurerKnowsMemberView",
  "watchedVideos",
  "canDoRoleTasks",
  "willAskForHelp",
] as const;

export type OnboardingAnswers = Record<(typeof BOOLEAN_KEYS)[number], boolean> & {
  note: string;
};

export type OnboardingStatus =
  | "assigned"
  | "pending"
  | "approved"
  | "rejected"
  | "retake";

export function emptyAnswers(): OnboardingAnswers {
  const answers = { note: "" } as OnboardingAnswers;
  for (const key of BOOLEAN_KEYS) {
    answers[key] = false;
  }
  return answers;
}

export function sanitizeAnswers(raw: unknown): OnboardingAnswers {
  const source =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const answers = emptyAnswers();
  for (const key of BOOLEAN_KEYS) {
    answers[key] = source[key] === true;
  }
  answers.note =
    typeof source.note === "string" ? source.note.trim().slice(0, 2000) : "";
  return answers;
}

export function sanitizeDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== trimmed) {
    return null;
  }
  return date;
}

function serializeDate(value: any): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function isApproverEmail(email: unknown): boolean {
  return (
    typeof email === "string" &&
    email.trim().toLowerCase() === ONBOARDING_APPROVER_EMAIL
  );
}

export async function getApproverId(db: any): Promise<string | null> {
  const user = await db.collection("user").findOne({ email: ONBOARDING_APPROVER_EMAIL });
  if (!user) return null;
  return String(user.id || user._id?.toString() || "");
}

export function serializeOnboarding(doc: any) {
  return {
    id: String(doc._id),
    userId: String(doc.userId || ""),
    userName: String(doc.userName || ""),
    userEmail: String(doc.userEmail || ""),
    answers: { ...emptyAnswers(), ...(doc.answers || {}) } as OnboardingAnswers,
    status: doc.status as OnboardingStatus,
    startDate: serializeDate(doc.startDate),
    dueDate: serializeDate(doc.dueDate),
    assignedBy: doc.assignedBy ? String(doc.assignedBy) : null,
    assignedAt: doc.assignedAt || null,
    attempt: Number(doc.attempt || 0),
    reviewNote: String(doc.reviewNote || ""),
    reviewedBy: doc.reviewedBy ? String(doc.reviewedBy) : null,
    reviewedAt: doc.reviewedAt || null,
    submittedAt: doc.submittedAt || null,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}
