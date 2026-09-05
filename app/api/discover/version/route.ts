import { NextResponse } from "next/server";
import { getDiscoverVersion } from "@/lib/discover-version";

export async function GET() {
  const version = await getDiscoverVersion();
  return NextResponse.json({ version });
}