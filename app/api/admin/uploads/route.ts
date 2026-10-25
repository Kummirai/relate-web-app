import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/community-auth";
import { clientIp } from "@/lib/public-api/request";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";

/**
 * Admin image uploads -> Cloudinary.
 *
 * The browser never talks to storage directly: the admin console
 * authenticates with better-auth against MongoDB, so this route stays the
 * gated path for server-side uploads (rate limit + admin session). The file
 * goes to Cloudinary over an unsigned preset and the returned secure_url is
 * stored as a string — no API secret is used anywhere.
 *
 * POST /api/admin/uploads  — multipart/form-data, field "file"
 */

const FOLDER = "relate/covers";
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

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isCloudinaryConfigured) {
    // Name the missing variable (never its value) so this is diagnosable from
    // the browser instead of guesswork. On Vercel a newly added env var only
    // reaches the app after a redeploy — check that before assuming a typo.
    const missing = [
      !process.env.CLOUDINARY_CLOUD_NAME ? "CLOUDINARY_CLOUD_NAME" : null,
      !process.env.CLOUDINARY_UPLOAD_PRESET ? "CLOUDINARY_UPLOAD_PRESET" : null,
    ].filter(Boolean);
    console.error("[uploads] storage not configured; missing:", missing.join(", "));
    return NextResponse.json(
      {
        error: `Cloudinary storage is not configured on the server (missing ${missing.join(", ")}).`,
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

  try {
    const { url, path } = await uploadToCloudinary(file, FOLDER);
    return NextResponse.json(
      { url, path },
      { headers: rateLimitHeaders(rl) },
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : "";
    console.error("[uploads] cloudinary upload failed:", detail || err);
    return NextResponse.json(
      { error: `Upload failed.${detail ? ` ${detail}` : ""}` },
      { status: 502, headers: rateLimitHeaders(rl) },
    );
  }
}
