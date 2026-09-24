import { getDb } from "./mongodb";

/**
 * Club-join applications — a public registration form for young people and
 * families joining a Relate sports club/team. Applications are stored for the
 * chaplaincy team to review; every new member is interviewed by a chaplain and
 * then accepted or guided on next steps (no one is auto-accepted).
 */

const CLUB_JOIN_COL = "club_join_applications";

// Clubs that have sports teams on the site — the registration form is scoped here.
const VALID_CLUBS = [
  "sprout-kids",
  "sprout-tweens",
  "sprout-teens",
  "surge",
  "pulse",
];

const VALID_SPORTS = ["Football", "Netball", "Volleyball"];

// Age band per club — applicants must sit inside their chosen club's band.
const CLUB_AGE_RANGES: Record<string, { min: number; max: number }> = {
  "sprout-kids": { min: 6, max: 8 },
  "sprout-tweens": { min: 9, max: 11 },
  "sprout-teens": { min: 12, max: 15 },
  surge: { min: 16, max: 21 },
  pulse: { min: 21, max: 33 },
};

// Valid team ids per club (mirrors the site's SPORTS_TEAMS). A team is required.
const CLUB_TEAMS: Record<string, Record<string, string>> = {
  "sprout-kids": {
    "sk-fc": "Football",
    "sk-netball": "Netball",
    "sk-volleyball": "Volleyball",
  },
  "sprout-tweens": {
    "stw-fc": "Football",
    "stw-netball": "Netball",
    "stw-volleyball": "Volleyball",
  },
  "sprout-teens": {
    "ste-fc": "Football",
    "ste-netball": "Netball",
    "ste-volleyball": "Volleyball",
  },
  surge: {
    "surge-fc": "Football",
    "surge-netball": "Netball",
    "surge-volleyball": "Volleyball",
  },
  pulse: {
    "pulse-fc": "Football",
    "pulse-netball": "Netball",
    "pulse-volleyball": "Volleyball",
  },
};

export type ClubJoinInput = {
  clubSlug: string;
  clubName?: string;
  teamId: string;
  teamName?: string;
  name: string;
  age?: number;
  gender: string;
  phone: string;
  area?: string;
  guardian?: { name: string; phone: string };
  parentConsent?: boolean;
  conduct: {
    alcohol: "yes" | "no";
    smoking: "yes" | "no";
    drugs: "yes" | "no";
    sexualActivity?: "yes" | "no";
  };
  commitmentAccepted: boolean;
};

export function cleanText(value: unknown, max = 120): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

export function cleanPhone(value: unknown): string {
  return String(value ?? "").replace(/[^\d+]/g, "");
}

function yesNo(value: unknown): "" | "yes" | "no" {
  const v = String(value ?? "");
  return v === "yes" || v === "no" ? v : "";
}

function httpError(status: number, message: string) {
  const err: any = new Error(message);
  err.status = status;
  return err;
}

/** Validate + persist a club-join application. Throws 400 with a clear message on bad input. */
export async function createClubJoinApplication(
  input: ClubJoinInput,
): Promise<{ id: string; status: string; nextSteps: string }> {
  const clubSlug = cleanText(input.clubSlug, 40).toLowerCase();
  if (!VALID_CLUBS.includes(clubSlug))
    throw httpError(400, "Pick a valid club to join.");

  const teamId = cleanText(input.teamId, 40);
  const sport = CLUB_TEAMS[clubSlug]?.[teamId];
  if (!sport)
    throw httpError(400, "Choose a valid team for your club — a team is required.");

  const name = cleanText(input.name, 80);
  if (!name) throw httpError(400, "Enter your full name.");
  if (name.length < 2) throw httpError(400, "Your name looks too short.");

  const age = Math.trunc(Number(input.age));
  if (!Number.isInteger(age) || age < 6 || age > 99)
    throw httpError(400, "Enter a valid age (6–99).");

  const range = CLUB_AGE_RANGES[clubSlug];
  if (range && (age < range.min || age > range.max))
    throw httpError(
      400,
      `This club is for ages ${range.min}–${range.max} — your age doesn't fit. Pick the right club for your age.`,
    );

  const gender = cleanText(input.gender, 10).toLowerCase();
  if (gender !== "male" && gender !== "female")
    throw httpError(400, "Gender must be male or female.");

  const phone = cleanPhone(input.phone);
  if (phone.length < 9 || phone.length > 15)
    throw httpError(400, "Enter a valid WhatsApp number.");

  const isMinor = age < 18;
  const guardian = (input.guardian ?? {}) as { name?: string; phone?: string };
  const guardianName = cleanText(guardian.name, 80);
  const guardianPhone = cleanPhone(guardian.phone);
  if (isMinor && (!guardianName || guardianPhone.length < 9))
    throw httpError(
      400,
      "Members under 18 must include a parent or guardian name and phone.",
    );
  if (isMinor && input.parentConsent !== true)
    throw httpError(
      400,
      "Under 18s need parental consent to join.",
    );

  const alcohol = yesNo(input.conduct?.alcohol);
  const smoking = yesNo(input.conduct?.smoking);
  const drugs = yesNo(input.conduct?.drugs);
  if (!alcohol || !smoking || !drugs)
    throw httpError(
      400,
      "Please answer the questions about alcohol, smoking and drugs.",
    );

  const requiresSexualConduct = clubSlug === "surge" || clubSlug === "pulse";
  let sexualActivity: "" | "yes" | "no" = "";
  if (requiresSexualConduct) {
    sexualActivity = yesNo(input.conduct?.sexualActivity);
    if (!sexualActivity)
      throw httpError(400, "Please answer the personal conduct question.");
  }

  const commitmentAccepted = input.commitmentAccepted === true;
  if (!commitmentAccepted)
    throw httpError(
      400,
      "Please accept the commitment to Relate's community standards.",
    );

  const doc = {
    clubSlug,
    clubName: cleanText(input.clubName, 80) || clubSlug,
    teamId,
    teamName: cleanText(input.teamName, 80) || undefined,
    sport,
    name,
    age,
    gender,
    phone,
    area: cleanText(input.area, 80) || undefined,
    guardian:
      isMinor ? { name: guardianName, phone: guardianPhone } : undefined,
    parentConsent: isMinor ? true : undefined,
    conduct: {
      alcohol,
      smoking,
      drugs,
      ...(requiresSexualConduct ? { sexualActivity } : {}),
    },
    commitmentAccepted,
    status: "pending_interview",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const db = await getDb();
  const inserted = await db.collection(CLUB_JOIN_COL).insertOne(doc);

  return {
    id: inserted.insertedId.toString(),
    status: "pending_interview",
    nextSteps:
      "A chaplain will contact you for a short interview before your place is confirmed. Your application reference is above.",
  };
}