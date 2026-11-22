import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { resolveSession } from "@/lib/community-auth";
import { withCpuTiming } from "@/lib/api-timing";
import { runScheduledReminders } from "@/lib/scheduled-notifications";

async function handlePost(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user || !ObjectId.isValid(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runScheduledReminders(new Date(), {
      userIds: [user.id],
      lookbackMs: 24 * 60 * 60_000,
    });
    console.info("[cron] catch-up reminders", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron] catch-up reminders failed", error);
    return NextResponse.json(
      { error: "Failed to send catch-up reminders" },
      { status: 500 },
    );
  }
}

export const POST = withCpuTiming("scheduled-reminders.catch-up.POST", handlePost);
