import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { withCpuTiming } from "@/lib/api-timing";
import { runScheduledReminders } from "@/lib/scheduled-notifications";

const CRON_URL_TOKEN_SALT = "relate-cron-url-v1";

function expectedToken(secret: string): string {
  return createHash("sha256").update(`${CRON_URL_TOKEN_SALT}:${secret}`).digest("hex");
}

function isValidToken(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

async function handleGet(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const secret = process.env.CRON_SECRET;
  const { token } = await params;
  if (!secret || !isValidToken(token, expectedToken(secret))) {
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

export const GET = withCpuTiming("cron/scheduled-reminders.run.GET", handleGet);
