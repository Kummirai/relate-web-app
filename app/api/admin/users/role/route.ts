import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";

async function findUserDoc(db: any, id: string) {
  const byId = await db.collection("user").findOne({ id });
  if (byId) return byId;
  if (ObjectId.isValid(id)) {
    return db.collection("user").findOne({ _id: new ObjectId(id) });
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const role = body.role;
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (role !== "admin" && role !== "user" && role !== "facilitator") {
      return NextResponse.json(
        { error: 'role must be "admin", "facilitator" or "user"' },
        { status: 400 },
      );
    }
    // Never allow an admin to demote themselves — they would lock themselves out.
    if (userId === admin.id && role !== "admin") {
      return NextResponse.json(
        { error: "You cannot remove your own admin role." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const user = await findUserDoc(db, userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const uid = user.id || user._id?.toString() || "";

    await db.collection("user").updateOne(
      { _id: user._id },
      { $set: { role, updatedAt: new Date() } },
    );

    await db.collection("user_activity").insertOne({
      userId: uid,
      actorId: admin.id,
      type: "role_change",
      section: "admin",
      itemId: uid,
      itemTitle: `${user.name || "User"} ${role === "admin" ? "promoted to admin" : "demoted to user"}`,
      details: { role },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: uid,
        name: user.name || "Unknown",
        email: user.email || "",
        role,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
