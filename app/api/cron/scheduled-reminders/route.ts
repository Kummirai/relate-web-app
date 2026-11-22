import { NextRequest, NextResponse } from "next/server";
import { withCpuTiming } from "@/lib/api-timing";
import { runScheduledReminders } from "@/lib/scheduled-notifications";

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
    const result = await runScheduledReminders(new Date());
    console.info("[cron] scheduled reminders", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron] scheduled reminders failed", error);
    return NextResponse.json(
      { error: "Failed to send scheduled reminders" },
      { status: 500 },
    );
  }
}

export const GET = withCpuTiming("cron/scheduled-reminders.GET", handleGet);
