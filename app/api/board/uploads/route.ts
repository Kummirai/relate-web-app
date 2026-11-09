import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/community-auth";
import { clientIp } from "@/lib/public-api/request";
import { rateLimit, rateLimitHeaders } from "@/lib/public-api/rate-limit";
import { isCloudinaryConfigured, uploadToCloudinaryFile } from "@/lib/cloudinary";

/**
 * Board minutes upload -> Cloudinary.
 *
 * Accepts a signed PDF or a photo/scan of the signed pages. `auto` resource
 * type keeps PDFs as raw files and images optimisable. The returned URL is
 * stored on the minutes document; the file itself never touches the server.
 *
 * POST /api/board/uploads  — multipart/form-data, field "file"
 */

const FOLDER = "relate/board-minutes";
// Keep under Vercel's 4.5 MB serverless request-body cap.
const MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isCloudinaryConfigured) {
    const missing = [
      !process.env.CLOUDINARY_CLOUD_NAME ? "CLOUDINARY_CLOUD_NAME" : null,
      !process.env.CLOUDINARY_UPLOAD_PRESET ? "CLOUDINARY_UPLOAD_PRESET" : null,
    ].filter(Boolean);
    console.error("[board-uploads] storage not configured; missing:", missing.join(", "));
    return NextResponse.json(
      {
        error: `Cloudinary storage is not configured on the server (missing ${missing.join(", ")}).`,
        missing,
      },
      { status: 503 },
    );
  }

  const rl = rateLimit(`board-uploads:${clientIp(request)}:${admin.id}`, 20, 60_000);
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
      { error: "Send the document as multipart/form-data under the \"file\" field." },
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
      { error: `The file is too large — ${MAX_BYTES / (1024 * 1024)} MB maximum.` },
      { status: 413 },
    );
  }

  const contentType = (file.type || "").toLowerCase();
  if (!ALLOWED[contentType]) {
    return NextResponse.json(
      { error: "Use a PDF, JPEG, PNG or WebP file." },
      { status: 415 },
    );
  }

  try {
    const { url, path } = await uploadToCloudinaryFile(file, FOLDER, "auto");
    return NextResponse.json(
      { url, path, contentType, fileName: file.name || null },
      { headers: rateLimitHeaders(rl) },
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : "";
    console.error("[board-uploads] cloudinary upload failed:", detail || err);
    return NextResponse.json(
      { error: `Upload failed.${detail ? ` ${detail}` : ""}` },
      { status: 502, headers: rateLimitHeaders(rl) },
    );
  }
}
