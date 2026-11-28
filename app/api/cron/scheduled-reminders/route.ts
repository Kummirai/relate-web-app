import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { withCpuTiming } from "@/lib/api-timing";
import { runScheduledReminders } from "@/lib/scheduled-notifications";

const QSTASH_ISSUER = "Upstash";
const CLOCK_TOLERANCE_SEC = 5;

type QStashClaims = {
  iss?: string;
  sub?: string;
  exp?: number;
  nbf?: number;
  body?: string;
};

function hasValidCronAuth(request: NextRequest, secret: string | undefined): boolean {
  const auth = request.headers.get("authorization") || "";
  if (!secret) return request.headers.get("x-vercel-cron") === "1";
  if (auth === `Bearer ${secret}`) return true;
  if (!auth.toLowerCase().startsWith("basic ")) return false;

  const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
  const separator = decoded.indexOf(":");
  if (separator < 0) return false;
  return decoded.slice(separator + 1) === secret;
}

// QStash sends an HS256 JWT in Upstash-Signature. Verified by hand so the
// backend needs no extra dependency beyond the signing keys.
function verifyQStashToken(token: string, key: string): QStashClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;

  let header: { alg?: string };
  try {
    header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (header.alg !== "HS256") return null;

  const expected = createHmac("sha256", key).update(`${headerPart}.${payloadPart}`).digest();
  const provided = Buffer.from(signaturePart, "base64url");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  let claims: QStashClaims;
  try {
    claims = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (claims.iss !== QSTASH_ISSUER) return null;
  if (typeof claims.exp !== "number" || now - CLOCK_TOLERANCE_SEC >= claims.exp) return null;
  if (typeof claims.nbf === "number" && claims.nbf > now + CLOCK_TOLERANCE_SEC) return null;
  return claims;
}

function expectedDestination(request: NextRequest): string {
  const configured = process.env.SCHEDULED_REMINDERS_URL;
  const url = configured ? new URL(configured) : new URL(request.url);
  url.search = "";
  url.hash = "";
  return url.href;
}

function bodyHash(body: string): string {
  return createHash("sha256").update(body).digest("base64url");
}

async function hasValidQStashSignature(
  request: NextRequest,
  rawBody: string,
): Promise<boolean> {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentKey && !nextKey) return false;

  const signature = request.headers.get("upstash-signature");
  if (!signature) return false;

  const claims =
    (currentKey ? verifyQStashToken(signature, currentKey) : null) ??
    (nextKey ? verifyQStashToken(signature, nextKey) : null);
  if (!claims) return false;
  if (claims.sub !== expectedDestination(request)) return false;
  if (typeof claims.body !== "string") return false;

  const expected = bodyHash(rawBody);
  return claims.body.replace(/=+$/, "") === expected.replace(/=+$/, "");
}

async function handleGet(request: NextRequest) {
  const rawBody = await request.text();
  const secret = process.env.CRON_SECRET;
  const authorized =
    hasValidCronAuth(request, secret) || (await hasValidQStashSignature(request, rawBody));
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runScheduledReminders(new Date());
    console.info("[cron] scheduled reminders", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron] scheduled reminders failed", error);
    return NextResponse.json(
      { error: "Failed to send scheduled reminders" },
      { status: 500 },
    );
  }
}

export const GET = withCpuTiming("cron/scheduled-reminders.GET", handleGet);
