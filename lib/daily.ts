/**
 * Thin wrapper around the Daily.co REST API (rooms + meeting tokens).
 *
 * Live group sessions (audio/video calls) are created by a group moderator
 * starting a session, which:
 *   1. creates a *private* Daily room (only people with a meeting token can
 *      join),
 *   2. stores it on the group as `activeSession` and flips `live: true`,
 *   3. notifies every joined member with the session's access code (OTP).
 *
 * Config comes from `DAILY_API_KEY` (Bearer token) and `DAILY_DOMAIN`
 * (the `your-org` part of `https://your-org.daily.co`). Both live in
 * `.env.local`.
 */

const DAILY_API_KEY = process.env.DAILY_API_KEY || "";
const DAILY_DOMAIN = process.env.DAILY_DOMAIN || "";

export function isDailyConfigured(): boolean {
  return !!DAILY_API_KEY && !!DAILY_DOMAIN;
}

export function dailyRoomUrl(roomName: string): string {
  return `https://${DAILY_DOMAIN}.daily.co/${roomName}`;
}

async function dailyFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`https://api.daily.co/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

function sanitizeRoomName(value: string): string {
  return value.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 60);
}

/** A short, unambiguous code (no 0/O/1/I) used to join a live session. */
export function makeAccessCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** A unique, shareable invite code for joining a group. */
export async function makeInviteCode(db: any, length = 6): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = "";
    for (let i = 0; i < length; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const existing = await db.collection("community_groups").findOne({ inviteCode: code });
    if (!existing) return code;
  }
  // Very unlikely fallback — still collision-safe enough for sharing.
  return `G-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

/**
 * Creates a private Daily room. Only callers presenting a valid meeting token
 * can join, so random users can't wander in without an invite.
 */
export async function createDailyRoom(opts: {
  groupId: string;
  type: "audio" | "video";
  maxParticipants?: number;
  /** How long the room stays open, in ms (default 2h). */
  durationMs?: number;
}): Promise<{ name: string; url: string }> {
  const durationMs = opts.durationMs || 2 * 60 * 60 * 1000;
  const exp = Math.round((Date.now() + durationMs) / 1000);
  const name = [
    "relate",
    opts.type,
    sanitizeRoomName(opts.groupId),
    Math.random().toString(36).slice(2, 8),
  ].join("-");

  const res = await dailyFetch("/rooms", {
    method: "POST",
    body: JSON.stringify({
      name,
      privacy: "private",
      properties: {
        exp,
        max_participants: opts.maxParticipants || 0,
        enable_prejoin_ui: false,
        enable_screenshare: true,
        start_audio_off: opts.type === "audio",
        start_video_off: true,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Daily createRoom failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  return { name: json.name as string, url: dailyRoomUrl(json.name as string) };
}

/** Mints a meeting token for a specific room + user. */
export async function createDailyMeetingToken(opts: {
  roomName: string;
  userName: string;
  isOwner?: boolean;
}): Promise<string> {
  const res = await dailyFetch("/meeting-tokens", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        room_name: opts.roomName,
        user_name: opts.userName,
        is_owner: !!opts.isOwner,
        enable_screenshare: true,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Daily meeting-token failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  return json.token as string;
}

/** Best-effort cleanup of a room when a session ends. */
export async function deleteDailyRoom(roomName: string): Promise<void> {
  try {
    const res = await dailyFetch(`/rooms/${encodeURIComponent(roomName)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[daily] deleteRoom ${res.status}: ${text.slice(0, 300)}`);
    }
  } catch (e) {
    console.error("[daily] deleteRoom failed", e);
  }
}
