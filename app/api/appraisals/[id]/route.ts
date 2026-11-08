import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  findUserById,
  requireAdmin,
  resolveSession,
} from "@/lib/community-auth";
import { createNotification, notifyAdmins } from "@/lib/inapp-notify";
import {
  getAdminPushTokens,
  getUserPushTokens,
  sendPushNotifications,
} from "@/lib/push";
import {
  APPRAISAL_FORMS,
  isAppraisalType,
  sanitizeAnswers,
  scoreAppraisal,
  STATUS_LABELS,
  type AppraisalStatus,
} from "@/lib/appraisals";

async function load(request: NextRequest, id: string) {
  if (!ObjectId.isValid(id)) return { error: "Invalid ID format", status: 400 as const };
  const session = await resolveSession(request);
  if (!session) return { error: "Unauthorized", status: 401 as const };

  const db = await getDb();
  const admin = await requireAdmin(request);
  const doc = await db
    .collection("appraisals")
    .findOne({ _id: new ObjectId(id) });

  if (!doc) return { error: "Appraisal not found", status: 404 as const };
  if (!admin && doc.subjectUserId !== session.id) {
    return { error: "Appraisal not found", status: 404 as const };
  }
  return { db, admin, session, doc };
}

/** Owner or admin: the appraisal with its form and any computed result. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const loaded = await load(request, id);
    if ("error" in loaded) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }
    const { doc, admin, session } = loaded;
    const type = isAppraisalType(doc.type) ? doc.type : "individual";
    const answers = doc.answers || {};
    const result =
      doc.status === "assigned" || doc.status === "rejected"
        ? scoreAppraisal(type, answers)
        : {
            score: typeof doc.score === "number" ? doc.score : null,
            band: doc.band || null,
            sections: scoreAppraisal(type, answers).sections,
          };

    return NextResponse.json({
      data: {
        _id: doc._id.toString(),
        type,
        title: APPRAISAL_FORMS[type].title,
        subjectUserId: doc.subjectUserId,
        subjectName: doc.subjectName || "Member",
        department: doc.department || null,
        season: doc.season,
        seasonYear: doc.seasonYear,
        status: doc.status as AppraisalStatus,
        statusLabel: STATUS_LABELS[doc.status as AppraisalStatus] ?? doc.status,
        answers,
        score: result.score,
        band: result.band,
        sections: result.sections,
        form: APPRAISAL_FORMS[type],
        assignedByName: doc.assignedByName || null,
        reviewNotes: doc.reviewNotes || "",
        reviewedByName: doc.reviewedByName || null,
        submittedAt: doc.submittedAt || null,
        reviewedAt: doc.reviewedAt || null,
        createdAt: doc.createdAt || null,
        canSubmit:
          !admin &&
          !!session &&
          doc.subjectUserId === session.id &&
          (doc.status === "assigned" || doc.status === "rejected"),
        canReview: !!admin && doc.status === "submitted",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load appraisal" },
      { status: 500 },
    );
  }
}

/**
 * Members submit their answers (again, after a rejection). Admins approve or
 * send the form back with notes; approving is what publishes the score to the
 * organisation performance screen.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const loaded = await load(request, id);
    if ("error" in loaded) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }
    const { db, admin, session, doc } = loaded;
    const type = isAppraisalType(doc.type) ? doc.type : "individual";
    const body = await request.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "";

    if (action === "approve" || action === "reject") {
      if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (doc.status !== "submitted") {
        return NextResponse.json(
          { error: "This appraisal is not awaiting review." },
          { status: 409 },
        );
      }
      const notes =
        typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) : "";
      const now = new Date();
      const status: AppraisalStatus = action === "approve" ? "approved" : "rejected";
      await db.collection("appraisals").updateOne(
        { _id: doc._id },
        {
          $set: {
            status,
            reviewNotes: notes,
            reviewedBy: admin.id,
            reviewedByName: admin.name || "Relate Admin",
            reviewedAt: now,
            updatedAt: now,
          },
        },
      );

      const approved = status === "approved";
      const title = approved ? "Appraisal approved" : "Appraisal sent back";
      const message = approved
        ? `Your ${doc.season} ${doc.seasonYear} appraisal was approved — ${doc.score}%.`
        : `Your ${doc.season} ${doc.seasonYear} appraisal was sent back with notes.`;
      await Promise.all([
        createNotification(db, doc.subjectUserId, {
          type: approved ? "appraisal_approved" : "appraisal_rejected",
          title,
          body: message,
          data: { appraisalId: doc._id.toString() },
        }),
        sendPushNotifications(
          await getUserPushTokens(db, doc.subjectUserId),
          title,
          message,
          {
            type: approved ? "appraisal_approved" : "appraisal_rejected",
            appraisalId: doc._id.toString(),
          },
        ),
      ]);

      return NextResponse.json({ data: { status, score: doc.score } });
    }

    // Submitting the form belongs to the member the appraisal was allocated to.
    if (admin && doc.subjectUserId !== session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (doc.status !== "assigned" && doc.status !== "rejected") {
      return NextResponse.json(
        { error: "This appraisal has already been submitted." },
        { status: 409 },
      );
    }

    const answers = sanitizeAnswers(type, body?.answers);
    const { score, band } = scoreAppraisal(type, answers);
    const now = new Date();
    await db.collection("appraisals").updateOne(
      { _id: doc._id },
      {
        $set: {
          answers,
          score,
          band,
          status: "submitted",
          submittedAt: now,
          updatedAt: now,
          reviewNotes: "",
        },
      },
    );

    const title =
      type === "department"
        ? `Department appraisal submitted — ${doc.department || doc.subjectName}`
        : `Appraisal submitted — ${doc.subjectName}`;
    const message = `${doc.season} ${doc.seasonYear} appraisal is ready for review.`;
    const adminTokens = await getAdminPushTokens(db, session?.id);
    await Promise.all([
      notifyAdmins(
        db,
        {
          type: "appraisal_submitted",
          title,
          body: message,
          data: { appraisalId: doc._id.toString() },
        },
        session?.id,
      ),
      sendPushNotifications(adminTokens, title, message, {
        type: "appraisal_submitted",
        appraisalId: doc._id.toString(),
      }),
    ]);

    return NextResponse.json({ data: { status: "submitted", score, band } });
  } catch {
    return NextResponse.json(
      { error: "Failed to update appraisal" },
      { status: 500 },
    );
  }
}
