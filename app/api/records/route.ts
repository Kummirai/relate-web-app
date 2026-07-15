import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get("better-auth.session_token")?.value ||
      request.cookies.get("__Secure-better-auth.session_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const session = await db.collection("session").findOne({ token });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db
      .collection("user")
      .findOne({ _id: new ObjectId(session.userId) });
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const records = await db
      .collection("familyrecords")
      .find({})
      .sort({ createdAt: -1 })
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
