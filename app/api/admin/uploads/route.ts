import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireAdmin } from "@/lib/community-auth";
import { clientIp } from "@/lib/public-api/request";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";

/**
 * Admin image uploads -> Supabase Storage.
 *
 * The browser never talks to Supabase directly: the admin console authenticates
 * with better-auth against MongoDB, so it holds no Supabase session and the anon
 * key would only ever get the `anon` role. Uploading here with the service role
 * key keeps the bucket closed to everyone except a signed-in admin — the service
 * role bypasses RLS, so no permissive insert policy is needed.
 *
 * Like lib/supabase-public.ts this talks to the Supabase REST API with plain
 * fetch, so the backend keeps its zero supabase-js dependency.
 *
 * POST /api/admin/uploads  — multipart/form-data, field "file"
 */

const BUCKET = "season-guides";
const PREFIX = "covers";
// 4 MB keeps us under Vercel's 4.5 MB serverless request-body cap. A 1410×2250
// cover at q85 is a few hundred KB, so real covers never come close.
const MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";

function extFromName(name: string): string | null {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  if (!match) return null;
  const ext = match[1].toLowerCase();
  return Object.values(ALLOWED).includes(ext) ? ext : null;
}

/** Collapse the upload to a safe, collision-free object path. */
function objectPath(originalName: string, mimeType: string): string {
  const ext = ALLOWED[mimeType] ?? extFromName(originalName) ?? "jpg";
  const stamp = new Date().toISOString().slice(0, 10);
  return `${PREFIX}/${stamp}_${randomBytes(6).toString("hex")}.${ext}`;
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    // Name the missing variable (never its value) so this is diagnosable from
    // the browser instead of guesswork. On Vercel a newly added env var only
    // reaches the app after a redeploy — check that before assuming a typo.
    const missing = [
      !SUPABASE_URL ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !SERVICE_ROLE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    ].filter(Boolean);
    console.error("[uploads] storage not configured; missing:", missing.join(", "));
    return NextResponse.json(
      {
        error: `Supabase storage is not configured on the server (missing ${missing.join(", ")}).`,
        missing,
      },
      { status: 503 },
    );
  }

  const rl = rateLimit(`admin-uploads:${clientIp(request)}:${admin.id}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many uploads — wait a minute and try again." },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Send the image as multipart/form-data under the \"file\" field." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image is too large — ${MAX_BYTES / (1024 * 1024)} MB maximum.` },
      { status: 413 },
    );
  }

  const contentType = (file.type || "").toLowerCase();
  if (!ALLOWED[contentType]) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG, WebP or AVIF image." },
      { status: 415 },
    );
  }

  const path = objectPath(file.name, contentType);

  try {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
      {
        method: "POST",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": contentType,
          "x-upsert": "false",
          "cache-control": "31536000",
        },
        body: await file.arrayBuffer(),
      },
    );

    if (!res.ok) {
      const detail = (await res.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;
      const hint = /bucket|not found/i.test(detail?.message ?? detail?.error ?? "")
        ? ` Create a Public bucket named "${BUCKET}" in the Supabase dashboard (Storage → New bucket), then retry.`
        : "";
      console.error(`[uploads] storage ${res.status}:`, detail?.message ?? detail?.error ?? res.statusText);
      return NextResponse.json(
        { error: `Upload failed (${res.status}).${hint}` },
        { status: 502, headers: rateLimitHeaders(rl) },
      );
    }

    return NextResponse.json(
      {
        url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`,
        path: `${BUCKET}/${path}`,
      },
      { headers: rateLimitHeaders(rl) },
    );
  } catch (err) {
    console.error("[uploads] storage request failed:", err);
    return NextResponse.json(
      { error: "Could not reach Supabase storage. Try again." },
      { status: 502 },
    );
  }
}
