import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "https://relate-iota.vercel.app",
  "https://relateworld.org",
  "http://localhost:3000",
  "http://localhost:8081",
  "exp://localhost:19000",
  "exp://localhost:19001",
  "null",
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === "null") return true;
  return ALLOWED_ORIGINS.some((allowed) => origin === allowed || origin.startsWith(`${allowed}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  const response = origin
    ? NextResponse.next()
    : new NextResponse(null, { status: 200 });

  if (request.method === "OPTIONS") {
    if (isAllowedOrigin(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin === "null" ? "*" : origin);
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, X-Requested-With");
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Max-Age", "86400");
    }
    return response;
  }

  if (isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin === "null" ? "*" : origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, X-Requested-With");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
