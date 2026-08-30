import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// Cache for 5 minutes — this runs 5 aggregation pipelines and the data
// rarely changes within a single user session.
let summaryCache: { data: any; ts: number } | null = null;
const SUMMARY_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Public aggregate for the "Sponsor a Relate" modal and home stats: families
 * helped, app downloads, sponsorship pledges, event fee income, and any
 * additional income (donations, books, other) recorded in published financial
 * reports.
 */
export async function GET(request: NextRequest) {
  try {
    if (summaryCache && Date.now() - summaryCache.ts < SUMMARY_TTL) {
      return NextResponse.json(summaryCache.data, {
        headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
      });
    }

    const db = await getDb();

    const [users, families, sponsorship, payments, reports] = await Promise.all([
      db.collection("user").countDocuments(),
      db.collection("familyrecords").countDocuments(),
      db
        .collection("sponsorships")
        .aggregate([
          // Only admin-approved pledges count towards reported income.
          { $match: { status: "approved" } },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              total: { $sum: "$amount" },
              paid: { $sum: "$amount" },
            },
          },
        ])
        .toArray(),
      db
        .collection("event_registrations")
        .aggregate([
          { $unwind: "$payments" },
          { $match: { "payments.status": { $in: ["approved", null] } } },
          { $group: { _id: null, total: { $sum: "$payments.amount" } } },
        ])
        .toArray(),
      // Sum non-sponsorship, non-event income from published financial reports
      // (donations, books, other) to capture all income sources.
      db
        .collection("financial_reports")
        .aggregate([
          { $match: { $or: [{ status: "published" }, { status: { $exists: false } }] } },
          {
            $group: {
              _id: null,
              donations: { $sum: { $ifNull: ["$income.donations", 0] } },
              books: { $sum: { $ifNull: ["$income.books", 0] } },
              other: { $sum: { $ifNull: ["$income.other", 0] } },
            },
          },
        ])
        .toArray(),
    ]);

    const sponsorshipTotal = sponsorship[0]?.total ?? 0;
    const eventIncome = payments[0]?.total ?? 0;
    const reportIncome =
      (reports[0]?.donations ?? 0) +
      (reports[0]?.books ?? 0) +
      (reports[0]?.other ?? 0);

    const data = {
      est: "Jan 2026",
      downloads: users,
      families,
      sponsorships: sponsorship[0]?.count ?? 0,
      sponsorshipTotal,
      sponsorshipPaid: sponsorship[0]?.paid ?? 0,
      eventIncome,
      fundsRaised: sponsorshipTotal + eventIncome + reportIncome,
    };

    summaryCache = { data, ts: Date.now() };

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
