import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession, resolveUser } from "@/lib/community-auth";
import { getAdminPushTokens, sendPushNotifications } from "@/lib/push";
import { notifyAdmins } from "@/lib/inapp-notify";

const STATUSES = ["pending", "in_review", "approved", "rejected"] as const;

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PER_USER = 2;

function str(v: unknown, cap: number): string {
  return typeof v === "string" ? v.trim().slice(0, cap) : "";
}

function optionalStr(v: unknown, cap: number): string | null {
  const s = str(v, cap);
  return s ? s : null;
}

async function requireAdmin(request: NextRequest) {
  const userId = await resolveUser(request);
  if (!userId || !ObjectId.isValid(userId)) return null;
  const db = await getDb();
  const user = await db
    .collection("user")
    .findOne({ _id: new ObjectId(userId) });
  if (!user || user.role !== "admin") return null;
  return userId;
}

export async function GET(request: NextRequest) {
  try {
    const adminId = await requireAdmin(request);
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const assigned = searchParams.get("assigned");
    const filter: Record<string, unknown> = {};
    if (status && (STATUSES as readonly string[]).includes(status)) {
      filter.status = status;
    }
    if (assigned === "me") {
      filter.assignedTo = adminId;
    }
    const rawLimit = Number(searchParams.get("limit")) || 200;
    const limit = Math.min(Math.max(rawLimit, 1), 500);

    const grants = await db
      .collection("school_grants")
      .aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        {
          $project: {
            applicantName: 1,
            relationship: 1,
            email: 1,
            suburb: 1,
            city: 1,
            province: 1,
            schoolName: 1,
            schoolLocation: 1,
            schoolPhone: 1,
            schoolType: 1,
            attendStatus: 1,
            hasArrears: 1,
            childName: 1,
            childAge: 1,
            grade: 1,
            childrenInSchool: 1,
            needText: 1,
            situationText: 1,
            nationality: 1,
            currentAid: 1,
            referral: 1,
            proofUrl: 1,
            userId: 1,
            status: 1,
            amount: 1,
            period: 1,
            adminNotes: 1,
            recordId: 1,
            assignedTo: 1,
            assignedToName: 1,
            assignedAt: 1,
            lastUserReadAt: 1,
            lastAdminReadAt: 1,
            createdAt: 1,
            updatedAt: 1,
            messages: { $slice: ["$messages", -1] },
          },
        },
        { $limit: limit },
      ])
      .toArray();

    return NextResponse.json({ data: grants });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch school grants" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    const applicantName = str(data.applicantName, 200);
    const relationship = str(data.relationship, 30);
    const email = str(data.email, 200);
    const suburb = str(data.suburb, 100);
    const city = str(data.city, 100);
    const province = str(data.province, 100);
    const schoolName = str(data.schoolName, 200);
    const schoolLocation = str(data.schoolLocation, 200);
    const schoolPhone = str(data.schoolPhone, 50);
    const schoolType = str(data.schoolType, 30);
    const attendStatus = str(data.attendStatus, 50);
    const hasArrears = data.hasArrears === true || data.hasArrears === "true";
    const childName = str(data.childName, 200);
    const childAge = str(data.childAge, 20);
    const grade = str(data.grade, 50);
    const childrenInSchool = str(data.childrenInSchool, 10);
    const needText = str(data.needText, 5000);
    const situationText = str(data.situationText, 5000);
    const nationality = str(data.nationality, 80);
    const currentAid = str(data.currentAid, 50);
    const referral = str(data.referral, 50);
    const consent = data.consent === true || data.consent === "true";
    const proofUrl = optionalStr(data.proofUrl, 2000);

    if (!applicantName || !childName || !schoolName || !needText) {
      return NextResponse.json(
        { error: "Applicant name, child name, school and need are required" },
        { status: 400 },
      );
    }
    if (!consent) {
      return NextResponse.json(
        { error: "Please confirm the application details are accurate" },
        { status: 400 },
      );
    }

    // Dedupe: a user may not apply for the same child more than once in the
    // cooldown window, and may have at most a few open applications at a time.
    const recent = await db.collection("school_grants").findOne({
      userId: user.id,
      childName,
      createdAt: { $gte: new Date(Date.now() - COOLDOWN_MS) },
    });
    if (recent) {
      return NextResponse.json(
        { error: "You have already applied for this child recently" },
        { status: 400 },
      );
    }
    const openCount = await db.collection("school_grants").countDocuments({
      userId: user.id,
      status: { $in: ["pending", "in_review"] },
    });
    if (openCount >= MAX_PER_USER) {
      return NextResponse.json(
        { error: "You already have open applications. Please wait for a response." },
        { status: 400 },
      );
    }

    const now = new Date();
    const doc = {
      userId: user.id,
      applicantName,
      relationship,
      email,
      suburb,
      city,
      province,
      schoolName,
      schoolLocation,
      schoolPhone,
      schoolType,
      attendStatus,
      hasArrears,
      childName,
      childAge,
      grade,
      childrenInSchool,
      needText,
      situationText,
      nationality,
      currentAid,
      referral,
      proofUrl,
      consent,
      status: "pending" as const,
      amount: null,
      period: null,
      adminNotes: null,
      recordId: null,
      assignedTo: null,
      assignedToName: null,
      assignedAt: null,
      lastUserReadAt: now,
      lastAdminReadAt: null,
      messages: [
        {
          from: "system",
          fromName: "",
          text: "Application received and waiting to be reviewed.",
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("school_grants").insertOne(doc);

    // Awaited so Vercel doesn't freeze the function before Expo delivery.
    try {
      const grantId = result.insertedId.toString();
      const tokens = await getAdminPushTokens(db);
      await sendPushNotifications(
        tokens,
        "New school grant application",
        `${applicantName} · ${childName} · ${schoolName}`,
        { type: "new_school_grant", grantId },
      );
      await notifyAdmins(
        db,
        {
          type: "new_school_grant",
          title: "New school grant application",
          body: `${applicantName} · ${childName} · ${schoolName}`,
          data: { grantId },
        },
        user.id,
      );
    } catch {}

    return NextResponse.json(
      { data: { _id: result.insertedId, ...doc } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to submit school grant application" },
      { status: 500 },
    );
  }
}
