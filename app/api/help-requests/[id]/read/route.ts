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
    if (!user || !ObjectId.isValid(user.id)) {
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

    const field = isAdmin ? "lastAdminReadAt" : "lastUserReadAt";
    await db
      .collection("help_requests")
      .updateOne({ _id: new ObjectId(id) }, { $set: { [field]: new Date() } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to mark request as read" }, { status: 500 });
  }
}
