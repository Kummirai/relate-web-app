This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Prayer reminders (QStash delayed messages)

PWA prayer/VOTD/reading reminders are delivered as delayed QStash messages,
not by polling:

- `POST /api/push/plan` runs every 12 hours (QStash schedule). It queues one
  delayed message per reminder (six prayers, 10-minute advance warnings,
  Verse of the Day, reading) for the next 24 hours of every web-push
  subscriber. All prayers are queued regardless of user toggles; the 24-hour
  window overlaps between runs so a missed run leaves no gap.
- `POST /api/push/deliver` is called by QStash at each reminder time. It reads
  the user's current settings and subscription, skips disabled reminders with
  a 200 (so QStash does not retry), removes dead subscriptions (404/410), and
  otherwise sends the web push.
- Toggling prayers never touches QStash — it is only a database update.
  Changing location, timezone, advance minutes or reading time re-plans that
  user's queue. A first-time push subscription plans immediately, and the PWA
  also calls `POST /api/scheduled-reminders/catch-up` on open.

Create or update the schedules from the terminal:

```bash
node --env-file=.env.local scripts/qstash-schedule.mjs
```

The script creates the `relate-reminder-plan` schedule (cron `0 */12 * * *`,
`POST {REMINDER_PLAN_URL or https://relate-iota.vercel.app}/api/push/plan`)
and deletes the obsolete `relate-scheduled-reminders` 5-minute schedule.

Deliveries are signed by QStash and verified with the HS256 JWT in
`Upstash-Signature`; the plan route also accepts `CRON_SECRET` bearer access
for manual runs. No auth header is needed on the QStash schedule itself.

Environment variables (backend `.env.local` and Vercel Production). QStash
supplies all four in its console under "Quickstart":

- `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` — runtime verification
  of each delivery.
- `QSTASH_URL`, `QSTASH_TOKEN` — publishing delayed messages and creating
  schedules.
- Optional: `REMINDER_PLAN_URL`, `REMINDER_DELIVER_URL` pin the exact
  destination URLs QStash signs (only needed if delivery arrives through a
  different host than the plan request).

Deliveries are claimed in `scheduled_push_sent`, so overlapping or retried
messages never send the same reminder twice; a transient web-push failure
releases the claim so QStash can retry.
