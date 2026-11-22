import { NextRequest, NextResponse } from "next/server";
import { withCpuTiming } from "@/lib/api-timing";
import { runScheduledReminders } from "@/lib/scheduled-notifications";

function hasValidCronAuth(request: NextRequest, secret: string | undefined): boolean {
  const auth = request.headers.get("authorization") || "";
  if (!secret) return request.headers.get("x-vercel-cron") === "1";
  if (auth === `Bearer ${secret}`) return true;
  if (!auth.toLowerCase().startsWith("basic ")) return false;

  const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
  const separator = decoded.indexOf(":");
  if (separator < 0) return false;
  return decoded.slice(separator + 1) === secret;
}

async function handleGet(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!hasValidCronAuth(request, secret)) {
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
