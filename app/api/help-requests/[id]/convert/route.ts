import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { ensureFamilyRecordIndexes } from "@/lib/models";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";
import { createNotification } from "@/lib/inapp-notify";

const URGENCY_MAP: Record<string, string> = {
  Urgent: "High",
  "This week": "Medium",
  "Not urgent": "Low",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const user = await resolveSession(request);
    if (!user || !ObjectId.isValid(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    await ensureFamilyRecordIndexes();
    const adminRecord = await db
      .collection("user")
      .findOne({ _id: new ObjectId(user.id) });
    if (adminRecord?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doc = await db
      .collection("help_requests")
      .findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // If a record already exists for this request, return it instead of duplicating.
    if (doc.recordId) {
      const existing = await db
        .collection("familyrecords")
        .findOne({ _id: new ObjectId(String(doc.recordId)) });
      if (existing) {
        return NextResponse.json({
          data: { recordId: String(doc.recordId), alreadyCreated: true },
        });
      }
    }

    const record = {
      recordId: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      dateOfIntake: new Date().toISOString().split("T")[0],
      caseManager: "",
      headOfHousehold: doc.name || "",
      contactNumber: doc.phone || "",
      alternateContactNumber: null,
      emailAddress: doc.email || null,
      physicalAddress: doc.area || "",
      preferredContactMethod: doc.contactMethod ? [doc.contactMethod] : [],
      householdMembers: [],
      summary: doc.description || "",
      urgencyLevel: URGENCY_MAP[doc.urgency] || "Medium",
      immediateNeeds: doc.helpType ? [doc.helpType] : [],
      longTermNeeds: [],
      actionLog: [
        {
          date: new Date().toISOString(),
          actionTaken: "Created from a help request",
          byWhom: user.name || "Admin",
          nextStep: null,
          dueDate: null,
        },
      ],
      caseClosedDate: null,
      reasonForClosure: null,
      finalOutcome: null,
      status: "Active",
      source: "help_request",
      sourceId: id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("familyrecords").insertOne(record);
    const recordId = result.insertedId.toString();

    await db
      .collection("help_requests")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { recordId, updatedAt: new Date() } },
      );

    // Let the requester know their request became a family record.
    // Awaited so Vercel doesn't freeze the function before Expo delivery.
    if (doc.userId) {
      try {
        const title = "Your help request has been recorded";
        const body = "An assistance record was created from your help request.";
        const tokens = await getUserPushTokens(db, doc.userId);
        await sendPushNotifications(tokens, title, body, {
          type: "help_converted",
          requestId: id,
          recordId,
        });
        await createNotification(db, doc.userId, {
          type: "help_converted",
          title,
          body,
          data: { requestId: id, recordId },
        });
      } catch {}
    }

    return NextResponse.json(
      { data: { recordId, alreadyCreated: false } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 },
    );
  }
}
