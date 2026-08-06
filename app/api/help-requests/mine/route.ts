import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const requests = await db
      .collection("help_requests")
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({ data: requests });
  } catch {
    return NextResponse.json({ error: "Failed to fetch your requests" }, { status: 500 });
  }
}
