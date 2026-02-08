import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import { FamilyRecord } from "../../../../lib/models";
import mongoose from "mongoose";

// Get a single record by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const record = await FamilyRecord.findById(id);

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("GET /api/records/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch record" },
      { status: 500 },
    );
  }
}

// Update a record by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const data = await request.json();
    const updatedRecord = await FamilyRecord.findByIdAndUpdate(
      params.id,
      data,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error("PUT /api/records/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 },
    );
  }
}

// Delete a record by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = await params;
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const deletedRecord = await FamilyRecord.findByIdAndDelete(id);

    if (!deletedRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/records/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete record" },
      { status: 500 },
    );
  }
}
