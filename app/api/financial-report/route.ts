import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/**
 * Admin-only financial report: sponsorship income, approved event fee income,
 * total funds raised, and a monthly breakdown for the last six months.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const [
      userCount,
      familyCount,
      sponsorshipTotals,
      sponsorshipDocs,
      paymentDocs,
      recent,
    ] = await Promise.all([
      db.collection("user").countDocuments(),
      db.collection("familyrecords").countDocuments(),
      db
        .collection("sponsorships")
        .aggregate([
          {
            $group: {
              _id: null,
              count: {
                $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
              },
              total: {
                $sum: { $cond: [{ $eq: ["$status", "approved"] }, "$amount", 0] },
              },
              paid: {
                $sum: { $cond: [{ $eq: ["$status", "approved"] }, "$amount", 0] },
              },
              pending: {
                $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] },
              },
            },
          },
        ])
        .toArray(),
      db
        .collection("sponsorships")
        .find({ status: "approved", createdAt: { $gte: sixMonthsAgo } })
        .project({ amount: 1, status: 1, createdAt: 1 })
        .toArray(),
      db
        .collection("event_registrations")
        .aggregate([
          { $unwind: "$payments" },
          { $match: { "payments.status": { $in: ["approved", null] } } },
          {
            $project: {
              amount: "$payments.amount",
              at: { $toDate: "$payments.paidAt" },
            },
          },
        ])
        .toArray(),
      db
        .collection("sponsorships")
        .find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray(),
    ]);

    // Bucket last six months (including the current one) by key.
    const months: { key: string; label: string; sponsorships: number; eventIncome: number }[] = [];
    const byKey = new Map<string, number>();
    for (const doc of sponsorshipDocs) {
      if (!doc.createdAt) continue;
      const key = monthKey(doc.createdAt);
      byKey.set(key, (byKey.get(key) ?? 0) + (doc.amount ?? 0));
    }
    const payByKey = new Map<string, number>();
    for (const p of paymentDocs) {
      if (!p.at || isNaN(p.at.getTime())) continue;
      const key = monthKey(p.at);
      payByKey.set(key, (payByKey.get(key) ?? 0) + (p.amount ?? 0));
    }
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      d.setMonth(d.getMonth() - i);
      const key = monthKey(d);
      months.push({
        key,
        label: monthLabel(key),
        sponsorships: byKey.get(key) ?? 0,
        eventIncome: payByKey.get(key) ?? 0,
      });
    }

    const sponsorshipTotal = sponsorshipTotals[0]?.total ?? 0;
    const eventIncomeTotal = paymentDocs.reduce((s, p) => s + (p.amount ?? 0), 0);

    return NextResponse.json({
      est: "Jan 2026",
      downloads: userCount,
      families: familyCount,
      totals: {
        sponsorships: sponsorshipTotals[0]?.count ?? 0,
        sponsorshipAmount: sponsorshipTotal,
        sponsorshipPaid: sponsorshipTotals[0]?.paid ?? 0,
        sponsorshipPledged: sponsorshipTotals[0]?.pending ?? 0,
        eventIncome: eventIncomeTotal,
        fundsRaised: sponsorshipTotal + eventIncomeTotal,
      },
      months,
      recent: recent.map((s) => ({
        _id: s._id.toString(),
        sponsorId: s.sponsorId,
        name: s.name,
        email: s.email,
        phone: s.phone,
        amount: s.amount,
        status: s.status,
        popUrl: s.popUrl,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate financial report" },
      { status: 500 },
    );
  }
}
