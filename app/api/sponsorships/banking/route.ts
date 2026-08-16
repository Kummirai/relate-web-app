import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";

const SETTINGS_ID = "sponsorship_banking";
const DEFAULT_BANKING = "Banking details to be added.";

/** Public: the banking details shown to sponsors in the pledge flow. */
export async function GET() {
  try {
    const db = await getDb();
    const doc = await db.collection("settings").findOne({ _id: SETTINGS_ID });
    return NextResponse.json({
      data: {
        bankingDetails:
          typeof doc?.bankingDetails === "string" && doc.bankingDetails.trim()
            ? doc.bankingDetails
            : DEFAULT_BANKING,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch banking details" },
      { status: 500 },
    );
  }
}

/** Admin only: update the banking details sponsors are shown. */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const bankingDetails =
      typeof body.bankingDetails === "string"
        ? body.bankingDetails.trim().slice(0, 500)
        : "";
    if (!bankingDetails) {
      return NextResponse.json(
        { error: "Banking details cannot be empty" },
        { status: 400 },
      );
    }

    const db = await getDb();
    await db.collection("settings").updateOne(
      { _id: SETTINGS_ID },
      {
        $set: { bankingDetails, updatedAt: new Date(), updatedBy: admin.id },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );

    return NextResponse.json({ data: { bankingDetails } });
  } catch {
    return NextResponse.json(
      { error: "Failed to save banking details" },
      { status: 500 },
    );
  }
}
