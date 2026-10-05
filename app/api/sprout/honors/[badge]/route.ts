import { NextRequest, NextResponse } from "next/server";

async function readBadge(params: Promise<{ badge: string }>) {
  const { badge } = await params;
  return String(badge || "").trim().toLowerCase();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ badge: string }> },
) {
  const badgeId = await readBadge(params);
  const url = new URL("/api/skills", request.url);
  if (badgeId) {
    url.searchParams.set("legacyBadge", badgeId);
  }
  return NextResponse.redirect(url, 308);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ badge: string }> },
) {
  return NextResponse.json(
    { error: "This endpoint has moved to /api/skills", deprecated: true },
    { status: 410 },
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
