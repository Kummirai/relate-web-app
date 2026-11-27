const destination =
  process.env.REMINDER_PLAN_URL || "https://relate-iota.vercel.app/api/push/plan";
const qstashUrl = process.env.QSTASH_URL;
const qstashToken = process.env.QSTASH_TOKEN;

if (!qstashUrl || !qstashToken) {
  console.error("QSTASH_URL and QSTASH_TOKEN must be set (copy them from Upstash console > QStash > Quickstart).");
  process.exit(1);
}

const base = qstashUrl.replace(/\/+$/, "");
const response = await fetch(`${base}/v2/schedules/${destination}`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${qstashToken}`,
    "Upstash-Cron": "0 */12 * * *",
    "Upstash-Method": "POST",
    "Upstash-Retries": "2",
    "Upstash-Schedule-Id": "relate-reminder-plan",
  },
});

const text = await response.text();
if (!response.ok) {
  console.error(`QStash schedule failed (${response.status}): ${text}`);
  process.exit(1);
}

console.log(`QStash plan schedule ready for ${destination}: ${text}`);

// The old 5-minute reminder schedule is obsolete: deliveries are now delayed
// QStash messages planned twice a day.
const removed = await fetch(`${base}/v2/schedules/relate-scheduled-reminders`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${qstashToken}` },
});
console.log(
  removed.ok
    ? "Removed the old relate-scheduled-reminders schedule"
    : `Old schedule not removed (${removed.status}) — delete it in the Upstash console if it still exists`,
);
