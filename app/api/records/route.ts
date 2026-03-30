import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb"; // Adjust the path based on your project structure
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const records = await db
      .collection("familyrecords")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    console.log(records);

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
    const db = await getDb();
    const data = await request.json();
    const doc = createFamilyRecord(data);

    const result = await db.collection("familyrecords").insertOne(doc);
    return NextResponse.json(
      { _id: result.insertedId, ...doc },
      { status: 201 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    const { id } = await request.json();

    await db.collection("familyrecords").deleteOne({ _id: new ObjectId(id) });
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
    const db = await getDb();
    const { id, ...data } = await request.json();

    const result = await db
      .collection("familyrecords")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: new Date() } },
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

function createFamilyRecord(data: any): Record<string, any> {
  return {
    ...data,
    createdAt: new Date(),
  };
}
