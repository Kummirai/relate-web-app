import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = await getDb();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recent = {
      $or: [{ createdAt: { $gte: since } }, { createdAt: { $gte: since.toISOString() } }],
    };

    const [
      totalUsers,
      admins,
      newUsers,
      families,
      events,
      skills,
      groups,
      prayers,
      jobs,
      supportTotal,
      supportOpen,
    ] = await Promise.all([
      db.collection("user").countDocuments(),
      db.collection("user").countDocuments({ role: "admin" }),
      db.collection("user").countDocuments(recent),
      db.collection("familyrecords").countDocuments(),
      db.collection("community_events").countDocuments(),
      db.collection("community_skills").countDocuments(),
      db.collection("community_groups").countDocuments(),
      db.collection("community_requests").countDocuments(),
      db.collection("community_jobs").countDocuments(),
      db.collection("help_requests").countDocuments(),
      db.collection("help_requests").countDocuments({ status: "open" }),
    ]);

    return NextResponse.json({
      data: {
        members: { total: totalUsers, admins, newLast30Days: newUsers, families },
        community: { events, skills, groups, prayers, jobs },
        support: { total: supportTotal, open: supportOpen },
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
