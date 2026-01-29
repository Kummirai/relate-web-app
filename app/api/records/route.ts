import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import { FamilyRecord } from "../../../lib/models";

export async function GET() {
  try {
    await connectDB();
    const records = await FamilyRecord.find().sort({ createdAt: -1 });
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
    await connectDB();
    const data = await request.json();
    const record = new FamilyRecord(data);

    const savedRecord = await record.save();

    return NextResponse.json(savedRecord, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 },
    );
  }
}
