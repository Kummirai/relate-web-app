import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";

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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const doc = await db.collection("help_requests").findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const userRecord = await db
      .collection("user")
      .findOne({ _id: new ObjectId(user.id) });
    const isAdmin = userRecord?.role === "admin";
    const isOwner = !!doc.userId && doc.userId === user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();
    const text = typeof data.text === "string" ? data.text.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    const message = {
      from: isAdmin ? ("admin" as const) : ("user" as const),
      fromName: user.name || (isAdmin ? "Support Team" : "You"),
      text,
      createdAt: new Date(),
    };

    const result = await db
      .collection("help_requests")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $push: { messages: message }, $set: { updatedAt: new Date() } },
        { returnDocument: "after" },
      );

    return NextResponse.json({ data: { message, request: result } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
