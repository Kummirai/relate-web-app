import { NextRequest } from "next/server";

/** Best-effort client IP for rate limiting behind proxies/Vercel. */
export function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "local";
}