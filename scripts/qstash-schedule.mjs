const destination =
  process.env.SCHEDULED_REMINDERS_URL ||
  "https://relate-iota.vercel.app/api/cron/scheduled-reminders";
const qstashUrl = process.env.QSTASH_URL;
const qstashToken = process.env.QSTASH_TOKEN;

if (!qstashUrl || !qstashToken) {
  console.error("QSTASH_URL and QSTASH_TOKEN must be set (copy them from Upstash console > QStash > Quickstart).");
  process.exit(1);
}

const endpoint = `${qstashUrl.replace(/\/+$/, "")}/v2/schedules/${destination}`;
const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${qstashToken}`,
    "Upstash-Cron": "2,7,12,17,22,27,32,37,42,47,52,57 * * * *",
    "Upstash-Method": "GET",
    "Upstash-Retries": "2",
    "Upstash-Schedule-Id": "relate-scheduled-reminders",
  },
});

const text = await response.text();
if (!response.ok) {
  console.error(`QStash schedule failed (${response.status}): ${text}`);
  process.exit(1);
}

console.log(`QStash schedule ready for ${destination}: ${text}`);
