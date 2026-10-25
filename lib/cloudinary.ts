/**
 * Cloudinary uploads for backend-held media (player headshots, admin covers).
 *
 * Uses an unsigned preset over plain fetch, matching this repo's
 * zero-SDK / zero-supabase-js style: the backend is just a privileged HTTP
 * client, and no API secret is required or shipped anywhere. The returned
 * `secure_url` is persisted as a plain string (MongoDB document fields),
 * never a file.
 *
 * Configure with CLOUDINARY_CLOUD_NAME + CLOUDINARY_UPLOAD_PRESET (both
 * public values — see CLOUDINARY_SETUP.md at the workspace root).
 */

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_UPLOAD_PRESET =
  process.env.CLOUDINARY_UPLOAD_PRESET || "";

export const isCloudinaryConfigured = !!(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET
);

/**
 * Upload an image straight to Cloudinary under `folder` and return its
 * secure URL plus the assigned public_id (the legacy `path` shape callers
 * already store). Throws with Cloudinary's own message on rejection.
 */
export async function uploadToCloudinary(
  file: File | Blob,
  folder: string,
): Promise<{ url: string; path: string }> {
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  body.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body },
  );
  const json = (await res.json().catch(() => null)) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  } | null;

  if (!res.ok || typeof json?.secure_url !== "string") {
    throw new Error(json?.error?.message || `Upload failed (${res.status}).`);
  }
  return { url: json.secure_url, path: json.public_id || json.secure_url };
}
