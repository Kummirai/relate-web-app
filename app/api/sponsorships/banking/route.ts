import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";

const SETTINGS_ID = "sponsorship_banking";

type Banking = {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  reference: string;
  instructions: string;
};

const EMPTY_BANKING: Banking = {
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  branchCode: "",
  accountType: "",
  reference: "",
  instructions: "",
};

function cleanString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Parse the old single-string format ("Bank: X | Account name: Y | ..."). */
function parseLegacy(raw: string): Banking {
  const get = (key: string) => {
    const match = raw.match(new RegExp(`${key}:\\s*([^|]+)`));
    return match ? match[1].trim() : "";
  };
  return {
    bankName: get("Bank"),
    accountHolder: get("Account name"),
    accountNumber: get("Account number"),
    branchCode: get("Branch code"),
    accountType: "",
    reference: "",
    instructions: raw.trim().slice(0, 500),
  };
}

function bankingFromDoc(doc: any): Banking {
  if (doc?.banking && typeof doc.banking === "object") {
    return { ...EMPTY_BANKING, ...doc.banking };
  }
  if (typeof doc?.bankingDetails === "string" && doc.bankingDetails.trim()) {
    return parseLegacy(doc.bankingDetails);
  }
  return { ...EMPTY_BANKING };
}

/** Public: the banking details shown to sponsors in the pledge flow. */
export async function GET() {
  try {
    const db = await getDb();
    const doc = await db.collection("settings").findOne({ _id: SETTINGS_ID });
    return NextResponse.json({ data: { banking: bankingFromDoc(doc) } });
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
    const banking: Banking = {
      bankName: cleanString(body.bankName, 80),
      accountHolder: cleanString(body.accountHolder, 120),
      accountNumber: cleanString(body.accountNumber, 40),
      branchCode: cleanString(body.branchCode, 20),
      accountType: cleanString(body.accountType, 40),
      reference: cleanString(body.reference, 160),
      instructions: cleanString(body.instructions, 500),
    };

    if (!banking.bankName || !banking.accountNumber) {
      return NextResponse.json(
        { error: "Bank name and account number are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    await db.collection("settings").updateOne(
      { _id: SETTINGS_ID },
      {
        $set: { banking, updatedAt: new Date(), updatedBy: admin.id },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );

    return NextResponse.json({ data: { banking } });
  } catch {
    return NextResponse.json(
      { error: "Failed to save banking details" },
      { status: 500 },
    );
  }
}
