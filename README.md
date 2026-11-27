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

## Scheduled reminders (QStash)

PWA prayer/reading reminders are sent by `/api/cron/scheduled-reminders`, which
must run every 5 minutes. A QStash schedule drives it because GitHub Actions
throttles frequent cron schedules (it was firing only a few times a day).

Create it once in the Upstash console (QStash -> Schedules):

- Destination: `https://relate-iota.vercel.app/api/cron/scheduled-reminders`
- Method: `GET`
- Cron: `2,7,12,17,22,27,32,37,42,47,52,57 * * * *`
- Retries: `2`

No auth header is needed on the schedule: the route verifies the
`Upstash-Signature` JWT that QStash sends with every delivery.

Environment variables (set in the backend project, local `.env` and Vercel
Production). QStash supplies all four in its console under "Quickstart":

- `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` — runtime verification
  of each delivery.
- `QSTASH_URL`, `QSTASH_TOKEN` — used only by the schedule script below.

Create or update the schedule from the terminal:

```bash
node scripts/qstash-schedule.mjs
```

The script uses schedule id `relate-scheduled-reminders`, so re-running it
updates the existing schedule. Override the destination with
`SCHEDULED_REMINDERS_URL` if it is not `https://relate-iota.vercel.app`.

The endpoint claims each event in `scheduled_push_sent`, so overlapping or
retried runs never send duplicates. `CRON_SECRET` bearer access is still
accepted for the manual GitHub workflow. QStash's free tier covers this
schedule: 288 messages/day out of the 1,000/day limit, within the 10 active
schedules allowance.
