// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Not logged in → redirect to sign in
  if (!session) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Logged in but not admin → redirect to unauthorized
  if (session.user.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: "/records/:path*",
};
