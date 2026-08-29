import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { ensureFamilyRecordIndexes } from "@/lib/models";
import { getUserPushTokens, sendPushNotifications } from "@/lib/push";
import { createNotification } from "@/lib/inapp-notify";

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
      .collection("school_grants")
      .findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

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

    const applicantName = doc.applicantName || "";
    const childName = doc.childName || "";
    const schoolAndGrade = [doc.schoolName, doc.grade].filter(Boolean).join(" · ");

    const record = {
      recordId: `REC-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`,
      dateOfIntake: new Date().toISOString().split("T")[0],
      caseManager: doc.assignedToName || "",
      headOfHousehold:
        doc.relationship === "Self" ? applicantName : applicantName,
      contactNumber: doc.schoolPhone || "",
      alternateContactNumber: null,
      emailAddress: doc.email || null,
      physicalAddress: [doc.suburb, doc.city, doc.province]
        .filter(Boolean)
        .join(", "),
      preferredContactMethod: [],
      householdMembers: [],
      summary: doc.needText || "",
      urgencyLevel: "Medium",
      immediateNeeds: ["School grant"],
      longTermNeeds: [],
      actionLog: [
        {
          date: new Date().toISOString(),
          actionTaken: `School grant for ${childName} (${schoolAndGrade})`,
          byWhom: user.name || "Admin",
          nextStep: null,
          dueDate: null,
        },
      ],
      caseClosedDate: null,
      reasonForClosure: null,
      finalOutcome: null,
      status: "Active",
      source: "school_grant",
      sourceId: id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("familyrecords").insertOne(record);
    const recordId = result.insertedId.toString();

    await db
      .collection("school_grants")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { recordId, updatedAt: new Date() } },
      );

    if (doc.userId) {
      try {
        const title = "Your school grant has been recorded";
        const body = "A family record was created from your school grant application.";
        const tokens = await getUserPushTokens(db, doc.userId);
        await sendPushNotifications(tokens, title, body, {
          type: "school_grant_recorded",
          grantId: id,
          recordId,
        });
        await createNotification(db, doc.userId, {
          type: "school_grant_recorded",
          title,
          body,
          data: { grantId: id, recordId },
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
