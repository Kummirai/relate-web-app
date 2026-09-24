import { NextRequest } from "next/server";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";
import {
  publicBadRequest,
  publicError,
  publicJson,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { createClubJoinApplication, type ClubJoinInput } from "@/lib/club-join";

function errorStatus(e: any): number {
  return typeof e?.status === "number" ? e.status : 500;
}

/**
 * POST /api/club-join
 *   { clubSlug, name, age, phone, conduct: { alcohol, smoking, drugs, sexualActivity? }, commitmentAccepted, ... }
 *   → stores the application as pending_interview for the chaplaincy team.
 */
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(`club-join:${clientIp(request)}`, 3, 60_000);
    if (!rl.ok) {
      return publicTooMany();
    }

    const body = (await request.json().catch(() => ({}))) as ClubJoinInput;

    const created = await createClubJoinApplication(body);
    return publicJson(
      created,
      { maxAge: 0, headers: rateLimitHeaders(rl) },
    );
  } catch (e: any) {
    console.error("POST /api/club-join failed", e);
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