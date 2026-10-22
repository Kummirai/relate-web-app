import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import {
  OFFICE_APPLICATIONS_COLLECTION,
  serializeApplication,
} from "@/lib/volunteer-offices";

/**
 * Admin list of office applications, newest first, optionally by status.
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const status = request.nextUrl.searchParams.get("status");
    const query: Record<string, string> = {};
    if (status) query.status = status;

    const apps = await db
      .collection(OFFICE_APPLICATIONS_COLLECTION)
      .find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({ data: apps.map(serializeApplication) });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
