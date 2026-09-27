import { randomBytes } from "crypto";
import { getDb } from "./mongodb";
import { CLUB_TEAMS } from "./club-join";
import {
  MAX_PER_POSITION,
  isSport,
  isValidPosition,
  positionCode,
  positionsForSport,
  type Sport,
} from "./sports-positions";

/**
 * Sports team registration — a player claims a position on a squad.
 *
 * Two rules drive everything here:
 *   - a position holds MAX_PER_POSITION registrants per squad (starter + depth);
 *   - the first applicants are the ones who appear on the team sheet, so rows
 *     are ordered by createdAt and later applicants wait in line behind them.
 *
 * Anyone can register — past the cap they are kept as a waitlist row rather
 * than turned away, so latecomers still get a record.
 */

export const SPORTS_REG_COL = "sports_registrations";

export type SportsRegistrationInput = {
  userId: string;
  clubSlug: string;
  clubName?: string;
  teamId: string;
  teamName?: string;
  position: string;
  name: string;
  age: number;
  gender?: string;
  phone?: string;
  heightCm: number;
  religion: string;
  foot: "left" | "right";
  hand: "left" | "right";
  photoUrl: string;
  photoPath: string;
};

export type SportsRegistrationPublic = {
  id: string;
  teamId: string;
  clubSlug: string;
  sport: Sport;
  position: string;
  positionCode: string;
  name: string;
  photoUrl: string;
  heightCm: number;
  foot: "left" | "right";
  hand: "left" | "right";
  status: "active" | "waitlist";
  order: number;
  createdAt: string;
};

function httpError(status: number, message: string) {
  const err: any = new Error(message);
  err.status = status;
  return err;
}

export function positionOrder(
  sport: Sport,
): { name: string; code: string; capacity: number }[] {
  return positionsForSport(sport).map((slot) => ({
    ...slot,
    capacity: MAX_PER_POSITION,
  }));
}

/** Resolves teamId + clubSlug to a sport, or throws 400 when the pair is bogus. */
export function resolveTeam(
  clubSlug: string,
  teamId: string,
): { sport: Sport; teams: Record<string, string> } {
  const teams = CLUB_TEAMS[clubSlug];
  if (!teams) throw httpError(400, "Pick a valid club to join.");
  const sport = teams[teamId];
  if (!sport) throw httpError(400, "Choose a valid team for your club.");
  if (!isSport(sport)) throw httpError(400, "That team has no known sport.");
  return { sport, teams };
}

/** Where a player's photo lives in Supabase Storage (avatars/players/…). */
export const PHOTO_BUCKET = "avatars";
export const PHOTO_PREFIX = "players";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";

export function storageConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Stores the headshot under avatars/players/{teamId}/… with the service role
 * key. The bucket is public-read, so the returned URL can be used as-is by the
 * squad pages; no insert policy is needed because we never go through RLS.
 */
export async function uploadPlayerPhoto(
  teamId: string,
  file: File,
): Promise<{ url: string; path: string }> {
  if (!storageConfigured()) {
    const missing = [
      !SUPABASE_URL ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !SERVICE_ROLE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    ].filter(Boolean);
    throw httpError(
      503,
      `Photo storage is not configured on the server (missing ${missing.join(", ")}).`,
    );
  }
  if (file.size === 0) throw httpError(400, "That photo is empty.");
  if (file.size > MAX_PHOTO_BYTES) {
    throw httpError(413, "Photo is too large — 4 MB maximum.");
  }
  const contentType = (file.type || "").toLowerCase();
  const ext = PHOTO_TYPES[contentType];
  if (!ext) throw httpError(415, "Use a JPEG, PNG, WebP or AVIF image.");

  const stamp = new Date().toISOString().slice(0, 10);
  const path = `${PHOTO_PREFIX}/${teamId}/${stamp}_${randomBytes(6).toString("hex")}.${ext}`;

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${PHOTO_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "false",
      "cache-control": "31536000",
    },
    body: await file.arrayBuffer(),
  });

  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as {
      message?: string;
      error?: string;
    } | null;
    console.error(
      "[sports-registrations] storage upload failed:",
      res.status,
      detail?.message ?? detail?.error ?? res.statusText,
    );
    throw httpError(502, `Could not store the photo (${res.status}). Try again.`);
  }

  return {
    url: `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`,
    path: `${PHOTO_BUCKET}/${path}`,
  };
}

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function asInt(value: unknown): number {
  const n = Number.parseInt(clean(value), 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Validate + persist a player registration. Throws 400 with a clear message on
 * bad input, 409 when this player already registered for the squad.
 */
export async function createSportsRegistration(
  input: SportsRegistrationInput,
): Promise<{
  id: string;
  position: string;
  positionCode: string;
  status: "active" | "waitlist";
  order: number;
  photoUrl: string;
  teamId: string;
}> {
  const clubSlug = clean(input.clubSlug);
  const teamId = clean(input.teamId);
  const { sport } = resolveTeam(clubSlug, teamId);

  const position = clean(input.position);
  if (!isValidPosition(sport, position)) {
    throw httpError(400, `Pick a ${sport} position from the list.`);
  }

  const name = clean(input.name);
  if (name.length < 2) throw httpError(400, "Enter the player's full name.");

  const age = asInt(input.age);
  if (age < 4 || age > 99) throw httpError(400, "Enter a valid age.");

  const heightCm = asInt(input.heightCm);
  if (heightCm < 80 || heightCm > 230) {
    throw httpError(400, "Enter a height between 80 cm and 230 cm.");
  }

  const religion = clean(input.religion);
  if (!religion) throw httpError(400, "Enter the player's religion.");

  const foot = input.foot === "left" ? "left" : input.foot === "right" ? "right" : null;
  if (!foot) throw httpError(400, "Choose the player's stronger foot.");
  const hand = input.hand === "left" ? "left" : input.hand === "right" ? "right" : null;
  if (!hand) throw httpError(400, "Choose the player's stronger hand.");

  const photoUrl = clean(input.photoUrl);
  const photoPath = clean(input.photoPath);
  if (!photoUrl.startsWith("http")) {
    throw httpError(400, "Add a profile photo before registering.");
  }

  const db = await getDb();
  const col = db.collection(SPORTS_REG_COL);

  const existing = await col.findOne({ userId: input.userId, teamId });
  if (existing) {
    throw httpError(409, "This player is already registered for that squad.");
  }

  const taken = await col.countDocuments({
    teamId,
    position,
    status: "active",
  });
  const status: "active" | "waitlist" =
    taken >= MAX_PER_POSITION ? "waitlist" : "active";
  // Queue number for the message we show: in-line for the sheet, or 1st on the
  // waiting list once the position is full.
  const order =
    status === "active"
      ? taken + 1
      : (await col.countDocuments({ teamId, position, status: "waitlist" })) + 1;

  const now = new Date();
  const doc = {
    userId: input.userId,
    clubSlug,
    clubName: clean(input.clubName),
    teamId,
    teamName: clean(input.teamName),
    sport,
    position,
    positionCode: positionCode(sport, position),
    name,
    age,
    gender: clean(input.gender) || undefined,
    phone: clean(input.phone) || undefined,
    heightCm,
    religion,
    foot,
    hand,
    photoUrl,
    photoPath,
    status,
    createdAt: now,
    updatedAt: now,
  };

  const inserted = await col.insertOne(doc as any);

  return {
    id: String(inserted.insertedId),
    position,
    positionCode: doc.positionCode,
    status,
    order,
    photoUrl,
    teamId,
  };
}

/**
 * Public squad list — safe fields only (no phone, age, religion or userId).
 * Ordered oldest first so the team sheet fills in registration order.
 */
export async function listSportsRegistrations(
  teamId: string,
): Promise<SportsRegistrationPublic[]> {
  const db = await getDb();
  const rows = await db
    .collection(SPORTS_REG_COL)
    .find({ teamId })
    .project({
      clubSlug: 1,
      sport: 1,
      position: 1,
      positionCode: 1,
      name: 1,
      photoUrl: 1,
      heightCm: 1,
      foot: 1,
      hand: 1,
      status: 1,
      createdAt: 1,
    })
    .sort({ createdAt: 1 })
    .limit(200)
    .toArray();

  const seen = new Map<string, number>();
  return rows.map((row) => {
    const position = String(row.position ?? "");
    const status = row.status === "waitlist" ? "waitlist" : "active";
    const key = `${position}:${status}`;
    const order = (seen.get(key) ?? 0) + 1;
    seen.set(key, order);
    const createdAt =
      row.createdAt instanceof Date ? row.createdAt.toISOString() : "";
    return {
      id: String(row._id),
      teamId,
      clubSlug: String(row.clubSlug ?? ""),
      sport: (isSport(row.sport) ? row.sport : "Football") as Sport,
      position,
      positionCode: String(row.positionCode ?? ""),
      name: String(row.name ?? ""),
      photoUrl: String(row.photoUrl ?? ""),
      heightCm: Number(row.heightCm ?? 0),
      foot: (row.foot === "left" ? "left" : "right") as "left" | "right",
      hand: (row.hand === "left" ? "left" : "right") as "left" | "right",
      status: row.status === "waitlist" ? "waitlist" : "active",
      order,
      createdAt,
    };
  });
}
