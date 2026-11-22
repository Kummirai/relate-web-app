import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import { withCpuTiming } from "@/lib/api-timing";

async function handleGet(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const [volunteers, help, social, orders] = await Promise.all([
    db.collection("volunteer_requests").countDocuments({ status: "new" }),
    db.collection("help_requests").countDocuments({ status: "open" }),
    db.collection("community_social_joins").countDocuments({ status: "pending" }),
    db.collection("orders").countDocuments({ status: "received" }),
  ]);

  return NextResponse.json({
    counts: {
      "/admin/volunteers": volunteers,
      "/admin/help-requests": help,
      "/admin/social-joins": social,
      "/admin/orders": orders,
    },
  });
}

export const GET = withCpuTiming("admin/nav-counts.GET", handleGet);
