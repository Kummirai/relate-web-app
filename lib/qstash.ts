import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

const QSTASH_ISSUER = "Upstash";
const CLOCK_TOLERANCE_SEC = 5;

type QStashClaims = {
  iss?: string;
  sub?: string;
  exp?: number;
  nbf?: number;
  body?: string;
};

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return "";
}

// QStash sends an HS256 JWT in Upstash-Signature. Verified by hand so the
// backend needs no extra dependency beyond the signing keys.
function verifyToken(token: string, key: string): QStashClaims | null {
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

function bodyHash(body: string): string {
  return createHash("sha256").update(body).digest("base64url");
}

export function expectedDestination(request: NextRequest, configured?: string | null): string {
  const url = configured ? new URL(configured) : new URL(request.url);
  url.search = "";
  url.hash = "";
  return url.href;
}

async function verifySignature(
  request: NextRequest,
  rawBody: string,
  expected: string,
): Promise<boolean> {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentKey && !nextKey) return false;

  const signature = request.headers.get("upstash-signature");
  if (!signature) return false;

  const claims =
    (currentKey ? verifyToken(signature, currentKey) : null) ??
    (nextKey ? verifyToken(signature, nextKey) : null);
  if (!claims) return false;
  if (claims.sub !== expected) return false;
  if (typeof claims.body !== "string") return false;

  return claims.body.replace(/=+$/, "") === bodyHash(rawBody).replace(/=+$/, "");
}

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

/** QStash signature, or a CRON_SECRET bearer for manual runs. */
export async function authorizeQStashRequest(
  request: NextRequest,
  rawBody: string,
  configuredUrl?: string | null,
): Promise<boolean> {
  if (hasValidCronAuth(request, process.env.CRON_SECRET)) return true;
  return verifySignature(request, rawBody, expectedDestination(request, configuredUrl));
}

export function reminderDedupeId(parts: Array<string | number>): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

export type DelayedPublish = {
  destination: string;
  body: string;
  notBefore: number;
  deduplicationId: string;
  retries?: number;
};

/**
 * Publishes each message as a delayed single-message request. Single publish
 * (not /v2/batch) because Upstash-Delay headers are the documented way to
 * schedule the delivery time, and the subscriber count is still small.
 */
export async function publishDelayedMessages(messages: DelayedPublish[]): Promise<number> {
  const base = text(process.env.QSTASH_URL).replace(/\/+$/, "");
  const token = text(process.env.QSTASH_TOKEN);
  if (!base || !token) throw new Error("QSTASH_URL and QSTASH_TOKEN are not configured");

  let published = 0;
  for (const message of messages) {
    const response = await fetch(`${base}/v2/publish/${message.destination}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Upstash-Not-Before": String(message.notBefore),
        "Upstash-Deduplication-Id": message.deduplicationId,
        "Upstash-Retries": String(message.retries ?? 2),
      },
      body: message.body,
      cache: "no-store",
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `QStash publish failed (${response.status}) for ${message.destination}: ${detail.slice(0, 300)}`,
      );
    }
    published++;
  }
  return published;
}
