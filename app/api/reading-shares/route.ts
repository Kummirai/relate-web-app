import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { clientIp } from "@/lib/public-api/request";
import { publicError, publicJson, publicOptions, publicTooMany } from "@/lib/public-api/render";

/**
 * Reading-plan share log.
 *
 * POST { slug, day?, title?, via? } — records that a reader shared a day's
 * reading (web | mobile). Optional session attaches the userId.
 * GET  ?slug=<slug>                 — how many times a plan has been shared.
 *
 * Collection: reading_shares { slug, day, title, via, userId, at }
 */

const MAX_SLUG = 80;
const MAX_TITLE = 200;

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(`reading-share:${clientIp(request)}`);
    if (!rl.ok) return publicTooMany();

    const body = await request.json().catch(() => null);
    const slug = typeof body?.slug === "string" ? body.slug.trim().slice(0, MAX_SLUG) : "";
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const session = await resolveSession(request);
    const db = await getDb();
    await db.collection("reading_shares").insertOne({
      slug,
      day: typeof body?.day === "number" && Number.isFinite(body.day) ? Math.trunc(body.day) : null,
      title: typeof body?.title === "string" ? body.title.slice(0, MAX_TITLE) : null,
      via: body?.via === "mobile" || body?.via === "web" ? body.via : "web",
      userId: session?.id ?? null,
      at: new Date(),
    });

    return publicJson({ success: true }, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error("POST /api/reading-shares failed", error);
    return publicError();
  }
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(`reading-share:${clientIp(request)}`);
    if (!rl.ok) return publicTooMany();

    const slug = request.nextUrl.searchParams.get("slug") || "";
    if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });

    const db = await getDb();
    const count = await db.collection("reading_shares").countDocuments({ slug: slug.slice(0, MAX_SLUG) });
    return publicJson({ slug, count }, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error("GET /api/reading-shares failed", error);
    return publicError();
  }
}

export { publicOptions as OPTIONS };
