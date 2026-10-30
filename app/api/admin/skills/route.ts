import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ensureIndexes, requireAdmin } from "@/lib/community-auth";
import { createNotification } from "@/lib/inapp-notify";
import { checksFrom, readTicks, statusOf } from "@/lib/skill-criteria";

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
  /** Full ticked grid — only included when a single member is requested. */
  criteria?: boolean[][];
  gradedAt?: Date | string | null;
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
    const userId = request.nextUrl.searchParams.get("userId")?.trim() || "";

    const db = await getDb();
    const filter: any = {};
    if (skillId) filter.skillId = skillId;
    if (levelId) filter.levelId = levelId;
    if (userId) filter.userId = userId;

    const docs = await db
      .collection("skill_progress")
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(userId ? 50 : 500)
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
        gradedAt: doc.gradedAt ?? null,
        ...(userId ? { criteria: Array.isArray(doc.criteria) ? doc.criteria : [] } : {}),
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

/**
 * Instructor sign-off — marks a participant's criteria grid for one level.
 * Body: `{ userId, skillId, levelId, criteria: boolean[][] }`.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) ?? {};
    const userId = String(body.userId || "").trim();
    const skillId = String(body.skillId || "").trim().toLowerCase();
    const levelId = String(body.levelId || "").trim();
    if (!userId || !skillId || !levelId) {
      return NextResponse.json(
        { error: "userId, skillId and levelId are required." },
        { status: 400 },
      );
    }

    const criteria = readTicks(body);
    if (!criteria) {
      return NextResponse.json(
        { error: "A valid criteria grid is required." },
        { status: 400 },
      );
    }

    const db = await getDb();
    await ensureIndexes(db);

    const existing = await db
      .collection("skill_progress")
      .findOne({ userId, skillId, levelId });

    const now = new Date();
    const checks = checksFrom(criteria);
    const status = statusOf(checks);
    const completedAt =
      status === "complete" ? (existing?.completedAt ?? now) : null;
    const enrolledAt = existing?.enrolledAt ?? now;

    await db.collection("skill_progress").updateOne(
      { userId, skillId, levelId },
      {
        $set: {
          criteria,
          checks,
          status,
          completedAt,
          enrolledAt,
          gradedBy: admin.id,
          gradedByName: admin.name,
          gradedAt: now,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    if (status === "complete" && existing?.status !== "complete") {
      await createNotification(db, userId, {
        type: "skill_complete",
        title: "Skill signed off",
        body: `Your instructor marked ${skillId} level ${levelId} complete.`,
        data: { skillId, levelId },
      });
    }

    const row = await db
      .collection("skill_progress")
      .findOne({ userId, skillId, levelId });

    return NextResponse.json({
      data: {
        ...progressOf(row),
        userId,
        skillId,
        levelId,
        criteria,
        completedAt,
        updatedAt: now,
        gradedAt: now,
      },
    });
  } catch (e) {
    console.error("POST /api/admin/skills failed", e);
    return NextResponse.json(
      { error: "Failed to save skill sign-off" },
      { status: 500 },
    );
  }
}
