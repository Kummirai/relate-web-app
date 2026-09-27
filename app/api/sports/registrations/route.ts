import { NextRequest } from "next/server";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";
import {
  publicError,
  publicJson,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { resolveUser } from "@/lib/community-auth";
import { getDb } from "@/lib/mongodb";
import { notifyAdmins } from "@/lib/inapp-notify";
import {
  createSportsRegistration,
  listSportsRegistrations,
  resolveTeam,
  storageConfigured,
  uploadPlayerPhoto,
} from "@/lib/sports-registrations";
import { isSport, positionsForSport, MAX_PER_POSITION } from "@/lib/sports-positions";

function errorStatus(e: any): number {
  return typeof e?.status === "number" ? e.status : 500;
}

/**
 * GET /api/sports/registrations?teamId=pulse-fc
 *
 * Public squad list for a team: who has claimed each position, in the order
 * they registered, plus how many places each position still has. Team pages use
 * it to replace the placeholder slots (name "Goalkeeper", badge "GK") with the
 * real players as they sign up.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`sports-reg:${clientIp(request)}`, 30, 60_000);
    if (!rl.ok) return publicTooMany();

    const teamId = new URL(request.url).searchParams.get("teamId") ?? "";
    if (!/^[a-z0-9-]{2,40}$/i.test(teamId)) {
      return publicJson({ error: "Unknown team." }, { status: 400, maxAge: 0 });
    }

    const registrations = await listSportsRegistrations(teamId);

    const counts: Record<string, { taken: number; capacity: number }> = {};
    if (registrations.length) {
      const sport = registrations[0].sport;
      if (isSport(sport)) {
        for (const slot of positionsForSport(sport)) {
          counts[slot.name] = {
            taken: registrations.filter(
              (r) => r.position === slot.name && r.status === "active",
            ).length,
            capacity: MAX_PER_POSITION,
          };
        }
      }
    }

    return publicJson(
      { teamId, registrations, counts },
      { maxAge: 15, headers: rateLimitHeaders(rl) },
    );
  } catch (e) {
    console.error("[sports/registrations] GET failed", e);
    return publicError();
  }
}

/**
 * POST /api/sports/registrations — multipart/form-data
 *
 * Fields: clubSlug, clubName, teamId, teamName, position, name, age, gender?,
 * phone?, heightCm, religion, foot, hand  +  photo (file, ≤4 MB).
 * Requires a signed-in account; the photo goes to Supabase Storage first so a
 * failed upload never leaves a record without a face.
 */
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(`sports-reg-post:${clientIp(request)}`, 6, 60_000);
    if (!rl.ok) return publicTooMany();

    const userId = await resolveUser(request);
    if (!userId) {
      return publicJson(
        { error: "Sign in to register for a team." },
        { status: 401, maxAge: 0 },
      );
    }

    if (!storageConfigured()) {
      return publicJson(
        { error: "Photo storage is not configured on the server." },
        { status: 503, maxAge: 0 },
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return publicJson(
        { error: "Send the form as multipart/form-data." },
        { status: 400, maxAge: 0 },
      );
    }

    const field = (key: string) => String(form.get(key) ?? "").trim();
    const clubSlug = field("clubSlug");
    const teamId = field("teamId");
    const { sport } = resolveTeam(clubSlug, teamId);

    const photo = form.get("photo");
    if (!(photo instanceof File)) {
      return publicJson(
        { error: "Add a profile photo before registering." },
        { status: 400, maxAge: 0 },
      );
    }

    const { url, path } = await uploadPlayerPhoto(teamId, photo);

    const created = await createSportsRegistration({
      userId,
      clubSlug,
      clubName: field("clubName"),
      teamId,
      teamName: field("teamName"),
      position: field("position"),
      name: field("name"),
      age: Number.parseInt(field("age"), 10),
      gender: field("gender"),
      phone: field("phone"),
      heightCm: Number.parseInt(field("heightCm"), 10),
      religion: field("religion"),
      foot: field("foot") === "left" ? "left" : "right",
      hand: field("hand") === "left" ? "left" : "right",
      photoUrl: url,
      photoPath: path,
    });

    getDb()
      .then((db) =>
        notifyAdmins(db, {
          type: "sports_registration",
          title: "New player registered",
          body: `${created.position} — ${field("name")} registered for ${field("teamName") || teamId}${created.status === "waitlist" ? " (waitlist)" : ""}.`,
          data: { registrationId: created.id, teamId, sport },
        }),
      )
      .catch((e) => console.error("[sports-registrations] notify failed:", e));

    return publicJson(created, { maxAge: 0, headers: rateLimitHeaders(rl) });
  } catch (e: any) {
    console.error("POST /api/sports/registrations failed", e);
    const status = errorStatus(e);
    if (status < 500) {
      return publicJson(
        { error: e?.message || "Bad request" },
        { status, maxAge: 0 },
      );
    }
    return publicError();
  }
}

export { publicOptions as OPTIONS };
