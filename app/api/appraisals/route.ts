import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  findUserById,
  requireAdmin,
  resolveSession,
} from "@/lib/community-auth";
import { createNotification } from "@/lib/inapp-notify";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";
import {
  currentSeason,
  isAppraisalType,
  SEASONS,
  STATUS_LABELS,
  type AppraisalStatus,
} from "@/lib/appraisals";

function summary(doc: any) {
  return {
    _id: doc._id.toString(),
    type: doc.type,
    subjectUserId: doc.subjectUserId,
    subjectName: doc.subjectName || "Member",
    department: doc.department || null,
    season: doc.season,
    seasonYear: doc.seasonYear,
    status: doc.status as AppraisalStatus,
    statusLabel: STATUS_LABELS[doc.status as AppraisalStatus] ?? doc.status,
    score: typeof doc.score === "number" ? doc.score : null,
    band: doc.band || null,
    assignedByName: doc.assignedByName || null,
    createdAt: doc.createdAt || null,
    submittedAt: doc.submittedAt || null,
    reviewedAt: doc.reviewedAt || null,
  };
}

/**
 * Signed-in users: admins see every appraisal, everyone else sees the ones
 * allocated to them.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await resolveSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await requireAdmin(request);
    const db = await getDb();
    const status = new URL(request.url).searchParams.get("status");
    const filter: any = admin ? {} : { subjectUserId: session.id };
    if (status && STATUS_LABELS[status as AppraisalStatus]) {
      filter.status = status;
    }

    const docs = await db
      .collection("appraisals")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({
      data: docs.map(summary),
      isAdmin: !!admin,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load appraisals" },
      { status: 500 },
    );
  }
}

/**
 * Admin only: allocate an appraisal. Individual appraisals go to the member;
 * department appraisals go to the department lead, who files the department's
 * figures.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const type = body?.type;
    if (!isAppraisalType(type)) {
      return NextResponse.json(
        { error: "Choose an individual or department appraisal" },
        { status: 400 },
      );
    }

    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
    if (!userId) {
      return NextResponse.json({ error: "Choose a member" }, { status: 400 });
    }

    const db = await getDb();
    const subject = await findUserById(db, userId);
    if (!subject) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const department =
      type === "department" && typeof body?.department === "string"
        ? body.department.trim().slice(0, 80)
        : "";
    if (type === "department" && !department) {
      return NextResponse.json(
        { error: "Name the department or club" },
        { status: 400 },
      );
    }

    const season =
      typeof body?.season === "string" &&
      (SEASONS as readonly string[]).includes(body.season)
        ? body.season
        : currentSeason().name;
    const seasonYear =
      Number.isInteger(body?.seasonYear) && body.seasonYear > 2000
        ? body.seasonYear
        : currentSeason().year;

    const duplicateFilter: any = {
      subjectUserId: userId,
      type,
      season,
      seasonYear,
      status: { $in: ["assigned", "submitted", "approved"] },
    };
    if (type === "department") duplicateFilter.department = department;
    const existing = await db.collection("appraisals").findOne(duplicateFilter);
    if (existing) {
      return NextResponse.json(
        { error: `An appraisal for this member already exists for ${season} ${seasonYear}.` },
        { status: 409 },
      );
    }

    const subjectName = subject.name || subject.email || "Member";
    const now = new Date();
    const doc = {
      type,
      subjectUserId: userId,
      subjectName,
      department: type === "department" ? department : null,
      season,
      seasonYear,
      status: "assigned" as AppraisalStatus,
      answers: {},
      score: null,
      band: null,
      assignedBy: admin.id,
      assignedByName: admin.name || "Relate Admin",
      assignedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("appraisals").insertOne(doc);

    const title =
      type === "department" ? "Department appraisal assigned" : "Appraisal assigned";
    const message =
      type === "department"
        ? `Complete the ${department} appraisal for ${season} ${seasonYear}.`
        : `Complete your ${season} ${seasonYear} appraisal.`;
    await Promise.all([
      createNotification(db, userId, {
        type: "appraisal_assigned",
        title,
        body: message,
        data: { appraisalId: result.insertedId.toString() },
      }),
      sendPushNotifications(
        await getUserPushTokens(db, userId),
        title,
        message,
        { type: "appraisal_assigned", appraisalId: result.insertedId.toString() },
      ),
    ]);

    return NextResponse.json({
      data: summary({ ...doc, _id: result.insertedId }),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to allocate appraisal" },
      { status: 500 },
    );
  }
}
