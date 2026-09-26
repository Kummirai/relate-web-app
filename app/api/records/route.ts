import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { ensureFamilyRecordIndexes } from "@/lib/models";
import { requireAdmin } from "@/lib/community-auth";

export async function GET(request: NextRequest) {
  try {
    const adminId = await requireAdmin(request);
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    await ensureFamilyRecordIndexes();
    const records = await db
      .collection("familyrecords")
      .find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await requireAdmin(request);
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    await ensureFamilyRecordIndexes();
    const data = await request.json();

    const doc = {
      recordId: data.recordId || `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dateOfIntake: data.dateOfIntake,
      caseManager: data.caseManager,
      headOfHousehold: data.headOfHousehold,
      contactNumber: data.contactNumber,
      alternateContactNumber: data.alternateContactNumber || null,
      emailAddress: data.emailAddress || null,
      physicalAddress: data.physicalAddress,
      preferredContactMethod: data.preferredContactMethod || [],
      householdMembers: (data.householdMembers || []).map((m: any) => ({
        name: m.name || null,
        age: m.age || null,
        relationship: m.relationship || null,
      })),
      summary: data.summary,
      urgencyLevel: data.urgencyLevel || "Medium",
      immediateNeeds: data.immediateNeeds || [],
      longTermNeeds: data.longTermNeeds || [],
      actionLog: (data.actionLog || []).map((e: any) => ({
        date: e.date || new Date().toISOString(),
        actionTaken: e.actionTaken || null,
        byWhom: e.byWhom || null,
        amountsUsed: e.amountsUsed || null,
        nextStep: e.nextStep || null,
        dueDate: e.dueDate || null,
      })),
      caseClosedDate: data.caseClosedDate || null,
      reasonForClosure: data.reasonForClosure || null,
      finalOutcome: data.finalOutcome || null,
      status: data.caseClosedDate ? "Closed" : data.status || "Active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("familyrecords").insertOne(doc);
    return NextResponse.json(
      { _id: result.insertedId, ...doc },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminId = await requireAdmin(request);
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id || !ObjectId.isValid(String(id))) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("familyrecords").deleteOne({ _id: new ObjectId(String(id)) });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete record" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await requireAdmin(request);
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ...data } = await request.json();
    if (!id || !ObjectId.isValid(String(id))) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const db = await getDb();
    data.updatedAt = new Date();
    if (data.caseClosedDate) {
      data.status = "Closed";
    }

    const result = await db
      .collection("familyrecords")
      .updateOne(
        { _id: new ObjectId(String(id)) },
        { $set: data },
      );
    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 },
    );
  }
}
