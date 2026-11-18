import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { findUserById, resolveUser } from "@/lib/community-auth";
import { createNotification } from "@/lib/inapp-notify";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";
import {
  ONBOARDING_COLLECTION,
  getApproverId,
  isApproverEmail,
  sanitizeAnswers,
  serializeOnboarding,
} from "@/lib/onboarding-induction";

export async function GET(request: NextRequest) {
  try {
    const uid = await resolveUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const currentUser = await findUserById(db, uid);
    const canApprove = isApproverEmail(currentUser?.email);
    const wantsQueue = request.nextUrl.searchParams.get("queue") === "1";
    const wantsAdmins = request.nextUrl.searchParams.get("admins") === "1";

    if (wantsAdmins) {
      if (!canApprove) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const admins = await db
        .collection("user")
        .find({ role: "admin" })
        .project({ id: 1, name: 1, email: 1 })
        .toArray();
      const ids = admins
        .map((admin: any) => String(admin.id || admin._id?.toString() || ""))
        .filter(Boolean);
      const docs = ids.length
        ? await db
            .collection(ONBOARDING_COLLECTION)
            .find({ userId: { $in: ids } })
            .toArray()
        : [];
      const byUser = new Map<string, ReturnType<typeof serializeOnboarding>>(
        docs.map((doc: any) => [String(doc.userId), serializeOnboarding(doc)]),
      );
      const data = admins.map((admin: any) => {
        const userId = String(admin.id || admin._id?.toString() || "");
        const record = byUser.get(userId) || null;
        return {
          userId,
          userName: String(admin.name || ""),
          userEmail: String(admin.email || ""),
          startDate: record?.startDate || null,
          dueDate: record?.dueDate || null,
          status: record?.status || null,
          attempt: record?.attempt || 0,
          submittedAt: record?.submittedAt || null,
          submissionId: record?.id || null,
        };
      });
      return NextResponse.json({ data, canApprove });
    }

    if (wantsQueue) {
      if (!canApprove) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const docs = await db
        .collection(ONBOARDING_COLLECTION)
        .find({ status: "pending" })
        .sort({ createdAt: 1 })
        .toArray();
      return NextResponse.json({
        data: docs.map(serializeOnboarding),
        canApprove,
      });
    }

    const doc = await db
      .collection(ONBOARDING_COLLECTION)
      .findOne({ userId: uid }, { sort: { updatedAt: -1 } });
    return NextResponse.json({
      data: doc ? serializeOnboarding(doc) : null,
      canApprove,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load onboarding" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const uid = await resolveUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const user = await findUserById(db, uid);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const answers = sanitizeAnswers(body?.answers ?? body);
    const now = new Date();
    const existing = await db
      .collection(ONBOARDING_COLLECTION)
      .findOne({ userId: uid });
    const update: Record<string, any> = {
      $set: {
        userId: uid,
        userName: String(user.name || ""),
        userEmail: String(user.email || ""),
        answers,
        status: "pending",
        submittedAt: now,
        updatedAt: now,
      },
      $unset: {
        reviewNote: "",
        reviewedBy: "",
        reviewedAt: "",
      },
      $setOnInsert: { createdAt: now, attempt: 1 },
    };
    if (existing && existing.status !== "pending") {
      update.$inc = { attempt: 1 };
    }

    await db
      .collection(ONBOARDING_COLLECTION)
      .updateOne({ userId: uid }, update, { upsert: true });

    const submission = await db
      .collection(ONBOARDING_COLLECTION)
      .findOne({ userId: uid });
    const submissionId = String(submission?._id || "");

    const approverId = await getApproverId(db);
    if (approverId) {
      const title = "Onboarding & induction submitted";
      const bodyText = `${String(user.name || "An admin")} submitted their onboarding and induction for approval.`;
      await createNotification(db, approverId, {
        type: "onboarding_induction",
        title,
        body: bodyText,
        data: { submissionId, userId: uid },
      });
      if (approverId !== uid) {
        const tokens = await getUserPushTokens(db, approverId);
        await sendPushNotifications(tokens, title, bodyText);
      }
    }

    return NextResponse.json({
      data: submission ? serializeOnboarding(submission) : null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to submit onboarding" }, { status: 500 });
  }
}
