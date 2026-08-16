import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

/**
 * Public aggregate for the "Sponsor a Relate" modal and home stats: families
 * helped, app downloads, sponsorship pledges, and event fee income.
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();

    const [users, families, sponsorship, payments] = await Promise.all([
      db.collection("user").countDocuments(),
      db.collection("familyrecords").countDocuments(),
      db
        .collection("sponsorships")
        .aggregate([
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              total: { $sum: "$amount" },
              paid: {
                $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] },
              },
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
    ]);

    const sponsorshipTotal = sponsorship[0]?.total ?? 0;
    const eventIncome = payments[0]?.total ?? 0;

    return NextResponse.json({
      est: "Jan 2026",
      downloads: users,
      families,
      sponsorships: sponsorship[0]?.count ?? 0,
      sponsorshipTotal,
      sponsorshipPaid: sponsorship[0]?.paid ?? 0,
      eventIncome,
      fundsRaised: sponsorshipTotal + eventIncome,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
