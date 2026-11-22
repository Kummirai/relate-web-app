import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { createNotification } from "@/lib/inapp-notify";
import { sendPushMessages, getUserPushTokens, type PushMessage } from "@/lib/push";
import { ONBOARDING_COLLECTION, getApproverId } from "@/lib/onboarding-induction";
import { withCpuTiming } from "@/lib/api-timing";

const TIME_ZONE = "Africa/Lusaka";
/** Records the assignee still has to act on. "pending" means it is already with the approver. */
const OUTSTANDING_STATUSES = ["assigned", "retake", "rejected"];

function dayKey(date: Date) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

function daysBetween(fromKey: string, toKey: string) {
  const from = new Date(`${fromKey}T00:00:00.000Z`).getTime();
  const to = new Date(`${toKey}T00:00:00.000Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}

function prettyDay(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function buildReminder(status: string, daysLeft: number, dueKey: string) {
  const due = prettyDay(dueKey);
  const needsRetake = status === "retake" || status === "rejected";
  const lead = needsRetake
    ? "Your onboarding and induction still needs resubmission. "
    : "";
  if (daysLeft < 0) {
    const days = Math.abs(daysLeft);
    return {
      title: "Onboarding & induction overdue",
      body: `${lead}It was due on ${due} — ${days} ${days === 1 ? "day" : "days"} ago. Open the app to submit it.`,
    };
  }
  if (daysLeft === 0) {
    return {
      title: "Onboarding & induction due today",
      body: `${lead}Today is the last day to submit. Open the app to complete it.`,
    };
  }
  return {
    title: needsRetake
      ? "Onboarding retake still open"
      : "Onboarding & induction reminder",
    body: `${lead}You have ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left — due ${due}.`,
  };
}

/**
 * Daily onboarding/induction nudge, both directions:
 * - assignees with an outstanding record (assigned, retake or rejected) get a
 *   reminder that follows the live record — days left, due today, or overdue;
 * - the approver gets a reminder for each submission that has been waiting on
 *   review for a day or more.
 * Each stops on its own once the record moves on.
 */
async function handleGet(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const hasSecret = Boolean(secret) && auth === `Bearer ${secret}`;
  const authorized = secret ? hasSecret : isVercelCron;
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const today = dayKey(new Date());
    const startOfTodayUtc = new Date(`${today}T00:00:00+02:00`);
    const force = hasSecret && request.nextUrl.searchParams.get("force") === "1";

    if (!force) {
      const claim = await db
        .collection("cron_runs")
        .updateOne(
          { _id: `onboarding-reminders:${today}` },
          { $setOnInsert: { createdAt: new Date() } },
          { upsert: true },
        );
      if (!claim.upsertedCount) {
        return NextResponse.json({ skipped: "already ran today", day: today });
      }
    }

    const docs = await db
      .collection(ONBOARDING_COLLECTION)
      .find(
        {
          status: { $in: OUTSTANDING_STATUSES },
          dueDate: { $type: "date" },
        },
        { projection: { userId: 1, status: 1, dueDate: 1 } },
      )
      .toArray();

    const userIds = [
      ...new Set(
        docs.map((doc) => String(doc.userId || "")).filter(Boolean),
      ),
    ];
    const tokenDocs = userIds.length
      ? await db
          .collection("push_tokens")
          .find(
            { userId: { $in: userIds } },
            { projection: { userId: 1, token: 1 } },
          )
          .toArray()
      : [];

    const tokensByUser = new Map<string, string[]>();
    for (const doc of tokenDocs) {
      const userId = doc?.userId ? String(doc.userId) : "";
      const token = typeof doc?.token === "string" ? doc.token : "";
      if (!userId || !token) continue;
      const list = tokensByUser.get(userId) || [];
      if (!list.includes(token)) list.push(token);
      tokensByUser.set(userId, list);
    }

    const messages: PushMessage[] = [];
    for (const doc of docs) {
      const userId = String(doc.userId || "");
      if (!userId) continue;
      const dueKey = dayKey(new Date(doc.dueDate));
      const status = String(doc.status || "assigned");
      const { title, body } = buildReminder(
        status,
        daysBetween(today, dueKey),
        dueKey,
      );
      const data = {
        route: "/onboarding-induction",
        action: "form",
        submissionId: String(doc._id),
        status,
        dueDate: dueKey,
        onboardingReminder: true,
      };

      await createNotification(db, userId, {
        type: "onboarding_induction",
        title,
        body,
        data,
      });
      for (const to of tokensByUser.get(userId) || []) {
        messages.push({ to, title, body, data });
      }
    }

    // Approver side: submissions that have been waiting on review for a day
    // or more. Today's submissions wait for tomorrow's run.
    let pendingReview = 0;
    const approverId = await getApproverId(db);
    if (approverId) {
      const pending = await db
        .collection(ONBOARDING_COLLECTION)
        .find(
          {
            status: "pending",
            submittedAt: { $type: "date", $lt: startOfTodayUtc },
          },
          {
            projection: {
              userId: 1,
              userName: 1,
              userEmail: 1,
              submittedAt: 1,
            },
          },
        )
        .toArray();
      const approverTokens = pending.length
        ? [...new Set(await getUserPushTokens(db, approverId))]
        : [];
      for (const doc of pending) {
        const waiting = daysBetween(dayKey(new Date(doc.submittedAt)), today);
        if (waiting < 1) continue;
        pendingReview++;
        const who = String(doc.userName || doc.userEmail || "An admin");
        const title = "Onboarding waiting for your review";
        const body = `${who} submitted their onboarding and induction ${
          waiting === 1 ? "yesterday" : `${waiting} days ago`
        } — it is still waiting for your approval.`;
        const data = {
          route: "/onboarding-induction",
          action: "review",
          submissionId: String(doc._id),
          status: "pending",
          reviewReminder: true,
        };
        await createNotification(db, approverId, {
          type: "onboarding_induction",
          title,
          body,
          data,
        });
        for (const to of approverTokens) {
          messages.push({ to, title, body, data });
        }
      }
    }

    await sendPushMessages(messages);
    return NextResponse.json({
      day: today,
      records: docs.length,
      pendingReview,
      sent: messages.length,
    });
  } catch (error) {
    console.error("[cron] onboarding reminders failed", error);
    return NextResponse.json(
      { error: "Failed to send onboarding reminders" },
      { status: 500 },
    );
  }
}

export const GET = withCpuTiming("cron/onboarding-reminders.GET", handleGet);
