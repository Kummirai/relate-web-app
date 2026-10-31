import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { resolveSession } from "@/lib/community-auth";
import { getDb } from "@/lib/mongodb";

export async function DELETE(request: NextRequest) {
  const session = await resolveSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = await getDb();
    const userId = session.id;
    const ownedFields = ["userId", "ownerId", "createdBy", "memberId"];
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();

    for (const entry of collections) {
      await db.collection(entry.name).deleteMany({
        $or: ownedFields.map((field) => ({ [field]: userId })),
      });
    }

    await db.collection("session").deleteMany({ userId });
    await db.collection("account").deleteMany({ userId });
    await db.collection("user").deleteMany({
      $or: [{ id: userId }, ...(ObjectId.isValid(userId) ? [{ _id: new ObjectId(userId) }] : [])],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion failed", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
