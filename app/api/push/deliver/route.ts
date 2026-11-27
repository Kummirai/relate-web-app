import { NextRequest, NextResponse } from "next/server";
import { withCpuTiming } from "@/lib/api-timing";
import { authorizeQStashRequest } from "@/lib/qstash";
import { deliverReminder, type ReminderPayload } from "@/lib/reminder-schedule";

async function handlePost(request: NextRequest) {
  const rawBody = await request.text();
  const authorized = await authorizeQStashRequest(
    request,
    rawBody,
    process.env.REMINDER_DELIVER_URL,
  );
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: ReminderPayload;
  try {
    payload = JSON.parse(rawBody) as ReminderPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const result = await deliverReminder(payload);
    console.info("[push/deliver]", payload.type, payload.eventKey, result);
    // Skips (disabled prayer, removed subscription, stale time) return 200 so
    // QStash does not retry them.
    return NextResponse.json(result);
  } catch (error) {
    console.error("[push/deliver] failed", payload?.type, payload?.eventKey, error);
    return NextResponse.json({ error: "Failed to deliver reminder" }, { status: 500 });
  }
}

export const POST = withCpuTiming("push/deliver.POST", handlePost);
