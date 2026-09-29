import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";
import {
  publicBadRequest,
  publicError,
  publicJson,
  publicNotFound,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { resolveSession, ensureIndexes } from "@/lib/community-auth";
import { getDb } from "@/lib/mongodb";
import { notifyAdmins } from "@/lib/inapp-notify";

/**
 * Camp registration — POST /api/camps/[slug]/register
 *
 *   { edition, camperName, dob, guardianName, guardianPhone,
 *     emergencyContact?, medicalNotes?, firstTime, consent }
 *
 * One open registration per account per camp edition. Signed-in accounts only;
 * admins are notified in-app as the registration lands. GET returns the
 * caller's own registration (or null) so the form can show status.
 */

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SLUG_RE = /^[a-z0-9-]{2,40}$/;

function reference(): string {
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return out;
}

function ageFromDob(dob: string): number | null {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const rl = rateLimit(`camp-reg:${clientIp(request)}`, 6, 60_000);
    if (!rl.ok) return publicTooMany();

    const { slug } = await params;
    const campSlug = str(slug, 40).toLowerCase();
    if (!SLUG_RE.test(campSlug)) return publicNotFound("Unknown camp.");

    const session = await resolveSession(request);
    if (!session) {
      return publicJson(
        { error: "Sign in to register for camp." },
        { status: 401, maxAge: 0 },
      );
    }

    const body = (await request.json().catch(() => ({}))) ?? {};

    const camperName = str(body.camperName, 80);
    const dob = str(body.dob, 10);
    const guardianName = str(body.guardianName, 80);
    const guardianPhone = str(body.guardianPhone, 20);
    const emergencyContact = str(body.emergencyContact, 120);
    const medicalNotes = str(body.medicalNotes, 1000);
    const edition = str(body.edition, 40);
    const firstTime = Boolean(body.firstTime);
    const consent = Boolean(body.consent);

    if (!edition) return publicBadRequest("Missing camp edition.");
    if (camperName.length < 2)
      return publicBadRequest("Please enter the camper's full name.");

    const age = dob ? ageFromDob(dob) : null;
    if (!age || age < 6 || age > 15)
      return publicBadRequest(
        "Campers must be between 6 and 15 years old — check the date of birth.",
      );

    if (guardianName.length < 2)
      return publicBadRequest("Please enter a parent or guardian's name.");
    const phoneDigits = guardianPhone.replace(/\D/g, "");
    if (phoneDigits.length < 9 || phoneDigits.length > 15)
      return publicBadRequest("Please enter a valid guardian phone number.");
    if (!consent)
      return publicBadRequest(
        "A parent or guardian must consent to the camp registration.",
      );

    const db = await getDb();
    await ensureIndexes(db);

    const existing = await db.collection("camp_registrations").findOne({
      userId: session.id,
      campSlug,
      edition,
      status: { $ne: "cancelled" },
    });
    if (existing) {
      return publicJson(
        {
          error: "This account already has a camp registration in.",
          registration: {
            reference: existing.reference,
            camperName: existing.camperName,
            status: existing.status,
            edition: existing.edition,
          },
        },
        { status: 409, maxAge: 0, headers: rateLimitHeaders(rl) },
      );
    }

    const doc = {
      reference: reference(),
      userId: session.id,
      camperName,
      dob,
      age,
      guardianName,
      guardianPhone,
      emergencyContact,
      medicalNotes,
      firstTime,
      campSlug,
      edition,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("camp_registrations").insertOne(doc);

    getDb()
      .then((d) =>
        notifyAdmins(
          d,
          {
            type: "camp_registration",
            title: "New camp registration",
            body: `${doc.camperName} (${doc.age}) registered for ${campSlug} — ${doc.edition}. Reference ${doc.reference}.`,
            data: {
              registrationId: result.insertedId.toString(),
              campSlug,
              edition: doc.edition,
              reference: doc.reference,
            },
          },
          session.id,
        ),
      )
      .catch((e) => console.error("[camp/register] notifyAdmins failed:", e));

    return publicJson(
      {
        data: {
          ...doc,
          _id: result.insertedId.toString(),
        },
      },
      { status: 201, maxAge: 0, headers: rateLimitHeaders(rl) },
    );
  } catch (e) {
    console.error("POST /api/camps/[slug]/register failed", e);
    return publicError();
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const campSlug = str(slug, 40).toLowerCase();
    if (!SLUG_RE.test(campSlug)) return publicNotFound("Unknown camp.");

    const db = await getDb();
    const session = await resolveSession(request);
    if (!session) return publicJson({ data: null }, { maxAge: 0 });

    const edition = str(
      new URL(request.url).searchParams.get("edition") ?? "",
      40,
    );
    const mine = await db.collection("camp_registrations").findOne(
      {
        userId: session.id,
        campSlug,
        ...(edition ? { edition } : {}),
      },
      { sort: { createdAt: -1 } },
    );
    if (!mine) return publicJson({ data: null }, { maxAge: 0 });

    const { _id, ...rest } = mine;
    return publicJson(
      { data: { ...rest, _id: String(_id) } },
      { maxAge: 0 },
    );
  } catch (e) {
    console.error("GET /api/camps/[slug]/register failed", e);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
