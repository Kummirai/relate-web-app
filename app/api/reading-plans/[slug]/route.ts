import { NextRequest } from "next/server";
import { getPublicPlan } from "@/lib/reading-plans";
import {
  publicError,
  publicJson,
  publicNotFound,
  publicOptions,
  publicTooMany,
} from "@/lib/public-api/render";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";

/**
 * GET /api/reading-plans/[slug]
 * Public read of a single reading plan plus its sections. Sections carry the
 * 5-chapter reading range (book/startCh/endCh), optional verse + authored
 * blocks, and a per-section quiz WITHOUT answer keys (correctIndex/explain are
 * stripped) so the "read to unlock" experience stays meaningful.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const rl = rateLimit(`reading-plan:${clientIp(request)}`);
    if (!rl.ok) {
      return publicTooMany();
    }

    const { slug } = await params;
    const resolved = await getPublicPlan(slug);
    if (!resolved) {
      return publicNotFound("Reading plan not found");
    }

    return publicJson(
      { plan: resolved.plan, sections: resolved.sections },
      { headers: rateLimitHeaders(rl) },
    );
  } catch (error) {
    console.error("GET /api/reading-plans/[slug] failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };