import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";

/**
 * Admin roll-up for Sprout honor progress — /api/admin/sprout/honors
 *
 *   GET ?badge=<id> → one row per participant with progress against that honor:
 *                     criteria proven, requirement status and piggy-bank total.
 *                     Without ?badge every record comes back so the dashboard
 *                     can show the whole framework at the end of a course.
 */

type Row = {
  userId: string;
  badgeId: string;
  name: string;
  email: string;
  status: "not_started" | "in_progress" | "complete";
  criteriaDone: number;
  criteriaTotal: number;
  requirementsDone: number;
  requirementsTotal: number;
  savingsTotal: number;
  savingsCount: number;
  completedAt: Date | string | null;
  updatedAt: Date | string | null;
};

function progressOf(doc: any): {
  status: Row["status"];
  criteriaDone: number;
  criteriaTotal: number;
  requirementsDone: number;
  requirementsTotal: number;
} {
  if (Array.isArray(doc?.criteria) && doc.criteria.length > 0) {
    let done = 0;
    let total = 0;
    let reqsDone = 0;
    for (const row of doc.criteria) {
      if (!Array.isArray(row)) continue;
      const proven = row.length > 0 && row.every(Boolean);
      total += row.length;
      if (proven) done += row.length;
      if (proven) reqsDone += 1;
    }
    return {
      status: (doc.status as Row["status"]) ?? "not_started",
      criteriaDone: done,
      criteriaTotal: total,
      requirementsDone: reqsDone,
      requirementsTotal: doc.criteria.length,
    };
  }

  const checks = Array.isArray(doc?.checks) ? doc.checks : [];
  return {
    status: (doc.status as Row["status"]) ?? "not_started",
    criteriaDone: checks.filter(Boolean).length,
    criteriaTotal: checks.length,
    requirementsDone: checks.filter(Boolean).length,
    requirementsTotal: checks.length,
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const badge = request.nextUrl.searchParams.get("badge")?.trim() || "";
    if (badge && !/^[a-z0-9-]{2,60}$/.test(badge))
      return NextResponse.json({ error: "Unknown honor." }, { status: 400 });

    const db = await getDb();
    const filter = badge ? { badgeId: badge } : {};
    const docs = await db
      .collection("honor_progress")
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(500)
      .toArray();

    const userIds = Array.from(
      new Set(docs.map((d: any) => String(d.userId ?? ""))).values(),
    ).filter(Boolean);
    const users = userIds.length
      ? await db
          .collection("user")
          .find({ id: { $in: userIds } })
          .project({ id: 1, name: 1, email: 1 })
          .toArray()
      : [];
    const byId = new Map(
      users.map((u: any) => [String(u.id), u as any]),
    );

    const data: Row[] = docs.map((doc: any) => {
      const user = byId.get(String(doc.userId)) ?? {};
      const savings = doc.savings ?? {};
      return {
        userId: String(doc.userId ?? ""),
        badgeId: String(doc.badgeId ?? ""),
        name: user.name || "Unknown member",
        email: user.email || "",
        ...progressOf(doc),
        savingsTotal:
          typeof savings.total === "number" && Number.isFinite(savings.total)
            ? savings.total
            : 0,
        savingsCount: Array.isArray(savings.deposits)
          ? savings.deposits.length
          : 0,
        completedAt: doc.completedAt ?? null,
        updatedAt: doc.updatedAt ?? null,
      };
    });

    return NextResponse.json({ data });
  } catch (e) {
    console.error("GET /api/admin/sprout/honors failed", e);
    return NextResponse.json(
      { error: "Failed to load honor progress" },
      { status: 500 },
    );
  }
}
