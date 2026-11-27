import { NextRequest, NextResponse } from "next/server";
import { withCpuTiming } from "@/lib/api-timing";
import { authorizeQStashRequest } from "@/lib/qstash";
import { planAllReminderQueues } from "@/lib/reminder-schedule";

async function handlePost(request: NextRequest) {
  const rawBody = await request.text();
  const authorized = await authorizeQStashRequest(
    request,
    rawBody,
    process.env.REMINDER_PLAN_URL,
  );
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const origin = new URL(request.url).origin;
    const result = await planAllReminderQueues(origin, new Date());
    console.info("[push/plan]", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[push/plan] failed", error);
    return NextResponse.json({ error: "Failed to plan reminders" }, { status: 500 });
  }
}

export const POST = withCpuTiming("push/plan.POST", handlePost);
