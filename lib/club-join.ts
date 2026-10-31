import { randomBytes } from "crypto";
import { getDb } from "./mongodb";

/**
 * Club-join registrations — the public form for young people and families
 * joining a Relate club (and optionally a squad). A valid submission is a
 * membership: the record is created active straight away, with no approval
 * step, and the member can see it on their membership page right away.
 */

const CLUB_JOIN_COL = "club_join_applications";

// Every club on the site can be registered for; sports teams are optional.
const VALID_CLUBS = [
  "sprout",
  "surge",
  "pulse",
  "prime",
  "anchor",
  "spark",
  "synergy",
  "sprout-kids",
  "sprout-tweens",
  "sprout-teens",
];

const VALID_SPORTS = ["Football", "Netball", "Volleyball"];

// Age band per club — applicants must sit inside their chosen club's band.
const CLUB_AGE_RANGES: Record<string, { min: number; max: number }> = {
  sprout: { min: 6, max: 15 },
  prime: { min: 33, max: 99 },
  "sprout-kids": { min: 6, max: 8 },
  "sprout-tweens": { min: 9, max: 12 },
  "sprout-teens": { min: 13, max: 15 },
  surge: { min: 16, max: 21 },
  pulse: { min: 21, max: 33 },
};

// Valid team ids per club (mirrors the site's SPORTS_TEAMS). Optional — a
// member registers for the club first and picks a team when joining a squad.
// Volleyball runs at Surge and Pulse only.
export const CLUB_TEAMS: Record<string, Record<string, string>> = {
  "sprout-kids": {
    "sk-fc": "Football",
    "sk-netball": "Netball",
  },
  "sprout-tweens": {
    "stw-fc": "Football",
    "stw-netball": "Netball",
  },
  "sprout-teens": {
    "ste-fc": "Football",
    "ste-netball": "Netball",
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
  /** Optional — team sign-ups go through the player registration form now. */
  teamId?: string;
  teamName?: string;
  name: string;
  age?: number;
  gender: string;
  phone: string;
  area?: string;
  /** What the member wants to take part in — saved on the membership record. */
  interests?: string[];
  guardian?: { name: string; phone: string };
  parentConsent?: boolean;
  conduct: {
    alcohol: "yes" | "no";
    smoking: "yes" | "no";
    drugs: "yes" | "no";
    sexualActivity?: "yes" | "no";
  };
  commitmentAccepted: boolean;
  /** Authenticated account that submitted the join — stamped by the route. */
  userId?: string;
  clubGatheringAccepted?: boolean;
};

/** Unambiguous alphabet — no 0/O/1/I, so IDs read cleanly. All caps. */
const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Every membership ID is exactly this many characters long. */
const REF_LENGTH = 8;

let referenceIndex: Promise<unknown> | null = null;

/** One-time indexes: unique membership IDs (legacy rows have none) + the /me lookup. */
export function ensureClubJoinIndexes(db: Awaited<ReturnType<typeof getDb>>) {
  if (!referenceIndex) {
    referenceIndex = Promise.all([
      db
        .collection(CLUB_JOIN_COL)
        .createIndex(
          { reference: 1 },
          { unique: true, partialFilterExpression: { reference: { $exists: true } } },
        ),
      db.collection(CLUB_JOIN_COL).createIndex({ userId: 1, createdAt: -1 }),
    ]).catch((e) => {
      console.error("[club-join] indexes failed:", e?.message);
    });
  }
  return referenceIndex;
}

/**
 * Club letters + random characters — 8 in total, all caps, checked for
 * uniqueness before use (e.g. SUR5K2MQ).
 */
async function makeReference(
  db: Awaited<ReturnType<typeof getDb>>,
  clubSlug: string,
): Promise<string> {
  const prefix = clubSlug.slice(0, 3).toUpperCase();
  const suffixLength = Math.max(1, REF_LENGTH - prefix.length);
  for (let attempt = 0; attempt < 6; attempt++) {
    const bytes = randomBytes(suffixLength);
    let suffix = "";
    for (const b of bytes) suffix += REF_ALPHABET[b % REF_ALPHABET.length];
    const reference = prefix + suffix;
    const taken = await db
      .collection(CLUB_JOIN_COL)
      .findOne({ reference }, { projection: { _id: 1 } });
    if (!taken) return reference;
  }
  throw httpError(500, "Could not allocate a unique membership ID — try again.");
}

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
): Promise<{ id: string; reference: string; status: string; nextSteps: string }> {
  const clubSlug = cleanText(input.clubSlug, 40).toLowerCase();
  if (!VALID_CLUBS.includes(clubSlug))
    throw httpError(400, "Pick a valid club to join.");

  const teamId = cleanText(input.teamId, 40);
  const sport = teamId ? CLUB_TEAMS[clubSlug]?.[teamId] : undefined;
  if (teamId && !sport)
    throw httpError(400, "Choose a valid team for your club.");

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

  const db = await getDb();
  await ensureClubJoinIndexes(db);

  // One active membership per person — you can't sit in two clubs at once.
  // (Graduated members age out of the ladder and may join the next club.)
  if (input.userId) {
    const existing = await db
      .collection(CLUB_JOIN_COL)
      .findOne(
        { userId: input.userId, status: "active" },
        { sort: { createdAt: -1 } },
      );
    if (existing) {
      throw httpError(
        409,
        `You're already a member of ${
          existing.clubName || existing.clubSlug
        } — one club at a time.`,
      );
    }
  }

  const reference = await makeReference(db, clubSlug);

  const doc = {
    reference,
    ...(input.userId ? { userId: input.userId } : {}),
    clubSlug,
    clubName: cleanText(input.clubName, 80) || clubSlug,
    ...(teamId ? { teamId, teamName: cleanText(input.teamName, 80) || undefined, sport } : {}),
    name,
    age,
    gender,
    phone,
    area: cleanText(input.area, 80) || undefined,
    interests: (Array.isArray(input.interests) ? input.interests : [])
      .map((i) => cleanText(i, 40))
      .filter(Boolean)
      .slice(0, 12),
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
    ...(input.clubGatheringAccepted === true
      ? { clubGatheringAccepted: true }
      : {}),
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const inserted = await db.collection(CLUB_JOIN_COL).insertOne(doc);

  return {
    id: inserted.insertedId.toString(),
    reference,
    status: "active",
    nextSteps:
      "You're a member — your membership is active right away. Keep your membership ID; your leader can look you up by it.",
  };
}

/**
 * Clubs in age order. When an active member's age falls outside their club's
 * band they are moved forward to the next club whose band fits them.
 */
const CLUB_LADDER = [
  "sprout-kids",
  "sprout-tweens",
  "sprout-teens",
  "sprout",
  "surge",
  "pulse",
  "prime",
];

/** Whole years between the join date and now — age ticks on join anniversaries. */
function yearsSince(from: Date): number {
  const ms = Date.now() - new Date(from).getTime();
  return Number.isFinite(ms) && ms > 0
    ? Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000))
    : 0;
}

/** The member's current age, tracked from the age they joined with. */
function ageNow(doc: { age?: number; createdAt?: Date }): number | null {
  if (typeof doc.age !== "number" || !doc.createdAt) return null;
  return doc.age + yearsSince(new Date(doc.createdAt));
}

/** Next club down the ladder whose age band contains `age`, or null. */
function nextClubFor(clubSlug: string, age: number): string | null {
  const idx = CLUB_LADDER.indexOf(clubSlug);
  if (idx === -1) return null;
  for (let i = idx + 1; i < CLUB_LADDER.length; i++) {
    const band = CLUB_AGE_RANGES[CLUB_LADDER[i]];
    if (band && age >= band.min && age <= band.max) return CLUB_LADDER[i];
  }
  return null;
}

async function clubDisplayName(db: Awaited<ReturnType<typeof getDb>>, slug: string): Promise<string> {
  const club = await db.collection("clubs").findOne({ slug }, { projection: { name: 1 } });
  if (club?.name) return club.name;
  return slug.replace(/(^|-)([a-z])/g, (_m, _d, c: string) => ` ${c.toUpperCase()}`).trim();
}

/**
 * Age-out promotion — if the member no longer fits their club's band, claim
 * the old row (atomic, so concurrent reads can't double-promote) and create
 * an active membership in the next fitting club with a fresh membership ID.
 */
async function promoteIfAgedOut(
  db: Awaited<ReturnType<typeof getDb>>,
  doc: any,
): Promise<any> {
  if (doc?.status !== "active") return doc;
  const age = ageNow(doc);
  if (age == null) return doc;
  const band = CLUB_AGE_RANGES[doc.clubSlug];
  if (!band || (age >= band.min && age <= band.max)) return doc;

  const target = nextClubFor(doc.clubSlug, age);
  if (!target) return doc;

  const now = new Date();
  const claim = await db.collection(CLUB_JOIN_COL).updateOne(
    { _id: doc._id, status: "active", promotedTo: { $exists: false } },
    {
      $set: {
        status: "graduated",
        promotedTo: target,
        promotedAt: now,
        updatedAt: now,
      },
    },
  );
  if (claim.modifiedCount === 0) {
    // Another read promoted it already — hand back the freshest row.
    return (
      (await db
        .collection(CLUB_JOIN_COL)
        .findOne({ userId: doc.userId }, { sort: { createdAt: -1 } })) ?? doc
    );
  }

  const reference = await makeReference(db, target);
  const promoted = {
    reference,
    ...(doc.userId ? { userId: doc.userId } : {}),
    clubSlug: target,
    clubName: await clubDisplayName(db, target),
    name: doc.name,
    age,
    gender: doc.gender,
    phone: doc.phone,
    ...(doc.area ? { area: doc.area } : {}),
    interests: Array.isArray(doc.interests) ? doc.interests : [],
    ...(doc.guardian ? { guardian: doc.guardian } : {}),
    ...(doc.parentConsent ? { parentConsent: doc.parentConsent } : {}),
    ...(doc.conduct ? { conduct: doc.conduct } : {}),
    commitmentAccepted: doc.commitmentAccepted === true,
    ...(doc.clubGatheringAccepted ? { clubGatheringAccepted: true } : {}),
    promotedFrom: { clubSlug: doc.clubSlug, reference: doc.reference, at: now },
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db.collection(CLUB_JOIN_COL).insertOne(promoted);
  } catch (e) {
    // Creation failed — put the old membership back in service.
    await db.collection(CLUB_JOIN_COL).updateOne(
      { _id: doc._id },
      { $set: { status: "active", updatedAt: new Date() }, $unset: { promotedTo: "", promotedAt: "" } },
    );
    throw e;
  }
  return promoted;
}

/**
 * The signed-in member's latest membership — aged out members are promoted to
 * the next club first, so callers always see the club they belong to today.
 */
export async function getLatestMembership(
  userId: string,
): Promise<Record<string, unknown> | null> {
  const db = await getDb();
  await ensureClubJoinIndexes(db);
  const latest = await db
    .collection(CLUB_JOIN_COL)
    .findOne({ userId }, { sort: { createdAt: -1 } });
  if (!latest) return null;
  const doc = await promoteIfAgedOut(db, latest);
  return serializeMembership(doc);
}

/** Membership rows shaped the way the web/mobile membership views read them. */
export function serializeMembership(doc: any) {
  return {
    id: String(doc._id),
    reference: doc.reference,
    clubSlug: doc.clubSlug,
    clubName: doc.clubName,
    name: doc.name,
    age: doc.age,
    gender: doc.gender,
    phone: doc.phone,
    area: doc.area ?? "",
    interests: Array.isArray(doc.interests) ? doc.interests : [],
    ...(doc.teamId ? { teamId: doc.teamId } : {}),
    ...(doc.teamName ? { teamName: doc.teamName } : {}),
    ...(doc.sport ? { sport: doc.sport } : {}),
    status: doc.status,
    joinedAt: doc.createdAt,
  };
}