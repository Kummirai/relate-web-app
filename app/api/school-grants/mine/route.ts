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
    const grants = await db
      .collection("school_grants")
      .aggregate([
        { $match: { userId: user.id } },
        { $sort: { createdAt: -1 } },
        {
          $project: {
            applicantName: 1,
            relationship: 1,
            email: 1,
            suburb: 1,
            city: 1,
            province: 1,
            schoolName: 1,
            schoolLocation: 1,
            schoolPhone: 1,
            schoolType: 1,
            attendStatus: 1,
            hasArrears: 1,
            childName: 1,
            childAge: 1,
            grade: 1,
            childrenInSchool: 1,
            needText: 1,
            situationText: 1,
            referral: 1,
            proofUrl: 1,
            userId: 1,
            status: 1,
            amount: 1,
            period: 1,
            adminNotes: 1,
            recordId: 1,
            assignedTo: 1,
            assignedToName: 1,
            assignedAt: 1,
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

    return NextResponse.json({ data: grants });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch your applications" },
      { status: 500 },
    );
  }
}
