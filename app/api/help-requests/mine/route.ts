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
    // Urgency-first (Urgent > This week > Not urgent > unset), then newest first.
    // Only the last chat message is included per request — the full thread is
    // fetched from /api/help-requests/[id] when a detail is opened.
    const requests = await db
      .collection("help_requests")
      .aggregate([
        { $match: { userId: user.id } },
        {
          $addFields: {
            urgencyRank: {
              $switch: {
                branches: [
                  { case: { $eq: ["$urgency", "Urgent"] }, then: 0 },
                  { case: { $eq: ["$urgency", "This week"] }, then: 1 },
                  { case: { $eq: ["$urgency", "Not urgent"] }, then: 2 },
                ],
                default: 3,
              },
            },
          },
        },
        // Sort before projecting so the rank field still exists for the sort.
        { $sort: { urgencyRank: 1, createdAt: -1 } },
        {
          $project: {
            name: 1,
            email: 1,
            phone: 1,
            area: 1,
            ageGroup: 1,
            contactMethod: 1,
            urgency: 1,
            whoFor: 1,
            helpType: 1,
            description: 1,
            userId: 1,
            status: 1,
            recordId: 1,
            lastUserReadAt: 1,
            lastAdminReadAt: 1,
            createdAt: 1,
            updatedAt: 1,
            messages: { $slice: ["$messages", -1] },
          },
        },
        { $limit: 100 },
      ])
      .toArray();

    return NextResponse.json({ data: requests });
  } catch {
    return NextResponse.json({ error: "Failed to fetch your requests" }, { status: 500 });
  }
}
