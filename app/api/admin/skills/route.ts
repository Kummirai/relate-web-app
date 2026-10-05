import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";

type Row = {
  userId: string;
  skillId: string;
  levelId: string;
  clubSlug: string;
  name: string;
  email: string;
  status: "not_started" | "in_progress" | "complete";
  criteriaDone: number;
  criteriaTotal: number;
  requirementsDone: number;
  requirementsTotal: number;
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

    const skillId = request.nextUrl.searchParams.get("skillId")?.trim() || "";
    const levelId = request.nextUrl.searchParams.get("levelId")?.trim() || "";

    const db = await getDb();
    const filter: any = {};
    if (skillId) filter.skillId = skillId;
    if (levelId) filter.levelId = levelId;

    const docs = await db
      .collection("skill_progress")
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(500)
      .toArray();

    const userIds = Array.from(
      new Set(docs.map((d: any) => String(d.userId ?? ""))).values(),
    ).filter(Boolean);
    const users: any[] = userIds.length
      ? await db
          .collection("user")
          .find({ id: { $in: userIds } })
          .project({ id: 1, name: 1, email: 1 })
          .toArray()
      : [];
    const byId: Record<string, { name?: string; email?: string }> = {};
    for (const u of users) {
      byId[String(u.id)] = { name: u.name, email: u.email };
    }

    const data: Row[] = docs.map((doc: any) => {
      const user = byId[String(doc.userId)] ?? {};
      return {
        userId: String(doc.userId ?? ""),
        skillId: String(doc.skillId ?? ""),
        levelId: String(doc.levelId ?? ""),
        clubSlug: String(doc.clubSlug ?? ""),
        name: user.name || "Unknown member",
        email: user.email || "",
        ...progressOf(doc),
        completedAt: doc.completedAt ?? null,
        updatedAt: doc.updatedAt ?? null,
      };
    });

    return NextResponse.json({ data });
  } catch (e) {
    console.error("GET /api/admin/skills failed", e);
    return NextResponse.json(
      { error: "Failed to load skill progress" },
      { status: 500 },
    );
  }
}
