import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { resolveSession } from "@/lib/community-auth";
import { withCpuTiming } from "@/lib/api-timing";
import { planReminderQueueForUser } from "@/lib/reminder-schedule";

// The PWA calls this on open: it tops up the user's delayed-message queue
// without waiting for the 12-hour plan run. A plan marker makes this a no-op
// when the user was planned within the last six hours with unchanged settings.
async function handlePost(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user || !ObjectId.isValid(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const outcome = await planReminderQueueForUser(
      user.id,
      new URL(request.url).origin,
      new Date(),
    );
    console.info("[push/plan] user queue", {
      userId: user.id,
      planned: outcome.planned,
      skipped: outcome.skipped,
    });
    return NextResponse.json({ ok: true, planned: outcome.planned, skipped: outcome.skipped });
  } catch (error) {
    console.error("[push/plan] user queue failed", error);
    return NextResponse.json(
      { error: "Failed to plan reminders" },
      { status: 500 },
    );
  }
}

export const POST = withCpuTiming("scheduled-reminders.catch-up.POST", handlePost);
