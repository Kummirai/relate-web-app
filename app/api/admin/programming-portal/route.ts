import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ensureIndexes, requireAdmin } from "@/lib/community-auth";
import { createNotification } from "@/lib/inapp-notify";

/**
 * Instructor approval for the Sprout Tweens programming portal.
 *
 * Blueprint §4: students never tick their own milestones — an admin reviews
 * the capstone and approves each milestone here, which unlocks the next
 * curriculum pages on the student's portal.
 */

const MILESTONE_XP = 50;
const QUIZ_XP_PER_POINT = 25;
const MASTER_BADGE_XP = 200;
const MAX_ID = 64;

type Row = {
  userId: string;
  name: string;
  email: string;
  milestones: string[];
  approvedCount: number;
  updatedAt: Date | string | null;
};

function milestoneKey(year: number, id: string) {
  return `${year}:${id}`;
}

function readId(value: unknown): string | null {
  const id = String(value ?? "").trim();
  if (!id || id.length > MAX_ID) return null;
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) return null;
  return id;
}

function computeXp(doc: any): number {
  const milestoneCount = Object.keys(doc.milestones ?? {}).length;
  let quizPoints = 0;
  for (const record of Object.values(doc.quizzes ?? {}) as any[]) {
    quizPoints += Math.min(Number(record?.score) || 0, 3) * QUIZ_XP_PER_POINT;
  }
  const badgeXp = doc.masterBadgeAwarded ? MASTER_BADGE_XP : 0;
  return milestoneCount * MILESTONE_XP + quizPoints + badgeXp;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDb();
    await ensureIndexes(db);

    const docs = await db
      .collection("programming_portal_progress")
      .find({})
      .sort({ updatedAt: -1 })
      .limit(500)
      .toArray();

    const userIds = docs.map((d: any) => String(d.userId ?? "")).filter(Boolean);
    const users: any[] = userIds.length
      ? await db
          .collection("user")
          .find({ id: { $in: userIds } })
          .project({ id: 1, name: 1, email: 1 })
          .toArray()
      : [];
    const byId: Record<string, { name?: string; email?: string }> = {};
    for (const u of users) byId[String(u.id)] = { name: u.name, email: u.email };

    const data: Row[] = docs.map((doc: any) => {
      const user = byId[String(doc.userId)] ?? {};
      const milestones = Object.keys(doc.milestones ?? {});
      return {
        userId: String(doc.userId ?? ""),
        name: user.name || "Unknown member",
        email: user.email || "",
        milestones,
        approvedCount: milestones.length,
        updatedAt: doc.updatedAt ?? null,
      };
    });

    return NextResponse.json({ data });
  } catch (e) {
    console.error("GET /api/admin/programming-portal failed", e);
    return NextResponse.json(
      { error: "Failed to load portal progress" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) ?? {};
    const userId = String(body.userId || "").trim();
    if (!userId)
      return NextResponse.json({ error: "userId is required." }, { status: 400 });

    const { year, id, approved } = body.milestone ?? {};
    const yearNum = Number(year);
    const milestoneId = readId(id);
    if (![1, 2, 3, 4].includes(yearNum))
      return NextResponse.json(
        { error: "milestone.year must be 1, 2, 3 or 4." },
        { status: 400 },
      );
    if (!milestoneId)
      return NextResponse.json(
        { error: "milestone.id is required." },
        { status: 400 },
      );
    if (typeof approved !== "boolean")
      return NextResponse.json(
        { error: "milestone.approved must be a boolean." },
        { status: 400 },
      );

    const db = await getDb();
    await ensureIndexes(db);

    const existing =
      (await db
        .collection("programming_portal_progress")
        .findOne({ userId })) ?? {};

    const milestones: Record<string, true> = { ...(existing.milestones ?? {}) };
    const key = milestoneKey(yearNum, milestoneId);
    if (approved) milestones[key] = true;
    else delete milestones[key];

    const now = new Date();
    const xp = computeXp({ ...existing, milestones });

    await db.collection("programming_portal_progress").updateOne(
      { userId },
      {
        $set: {
          milestones,
          xp,
          updatedAt: now,
          approvedBy: admin.id,
          approvedByName: admin.name,
          approvedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
          quizzes: {},
          masterBadgeAwarded: false,
          masterBadgeAwardedAt: null,
          streakCurrent: 0,
          streakLongest: 0,
          streakLastActiveDate: null,
        },
      },
      { upsert: true },
    );

    if (approved) {
      await createNotification(db, userId, {
        type: "portal_milestone",
        title: "Milestone approved",
        body: `Your instructor approved ${milestoneId} (Year ${yearNum}).`,
        data: { year: yearNum, milestoneId },
      });
    }

    return NextResponse.json({
      data: {
        userId,
        milestones: Object.keys(milestones),
        approvedCount: Object.keys(milestones).length,
        xp,
      },
    });
  } catch (e) {
    console.error("POST /api/admin/programming-portal failed", e);
    return NextResponse.json(
      { error: "Failed to save milestone approval" },
      { status: 500 },
    );
  }
}
