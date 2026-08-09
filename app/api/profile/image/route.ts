import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";

// Vercel serverless bodies are capped (~4.5MB on Hobby), so keep avatars small.
const MAX_BYTES = 3 * 1024 * 1024;
const CACHE_SECONDS = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
  try {
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof Blob) || file.size === 0) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image is too large" }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const contentType = file.type && /^image\//.test(file.type) ? file.type : "image/jpeg";
    const base64 = bytes.toString("base64");

    const db = await getDb();
    await db.collection("profile_images").updateOne(
      { userId: user.id },
      {
        $set: {
          userId: user.id,
          imageData: base64,
          contentType,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    const origin = process.env.BETTER_AUTH_URL || request.nextUrl.origin;
    const url = `${origin}/api/profile/image?userId=${encodeURIComponent(user.id)}&v=${Date.now()}`;

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

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return new NextResponse("Missing userId", { status: 400 });
    }

    const db = await getDb();
    const doc = await db.collection("profile_images").findOne({ userId });
    if (!doc || !doc.imageData) {
      return new NextResponse("Not found", { status: 404 });
    }

    const bytes = Buffer.from(doc.imageData, "base64");
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": doc.contentType || "image/jpeg",
        "Cache-Control": `public, max-age=${CACHE_SECONDS}, immutable`,
      },
    });
  } catch {
    return new NextResponse("Failed to load image", { status: 500 });
  }
}
