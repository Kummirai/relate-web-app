import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";

// Persists a hosted profile image URL (e.g. Supabase Storage) on the signed-in
// user's record. The image bytes themselves live in the storage provider.
export async function POST(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const url = typeof data.url === "string" ? data.url.trim() : "";
    if (!url || url.length > 2000) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("user").updateOne(
      { $or: [{ id: user.id }, ...(ObjectId.isValid(user.id) ? [{ _id: new ObjectId(user.id) }] : [])] },
      { $set: { image: url } },
    );

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Failed to save profile image:", err);
    return NextResponse.json({ error: "Failed to save profile image" }, { status: 500 });
  }
}
