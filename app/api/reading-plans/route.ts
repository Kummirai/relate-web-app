import { NextRequest } from "next/server";
import { listPublicPlans } from "@/lib/reading-plans";
import {
  publicError,
  publicJson,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";

/**
 * GET /api/reading-plans
 * Public list of reading plans (no auth key). Each item is plan metadata —
 * slug, title, tagline, description, category, section, days, gradient, image.
 * Authored plans from Supabase (reading_plans) are layered over the catalog.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`reading-plans:${clientIp(request)}`);
    if (!rl.ok) {
      return publicTooMany();
    }

    const plans = await listPublicPlans();
    return publicJson(plans, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error("GET /api/reading-plans failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };