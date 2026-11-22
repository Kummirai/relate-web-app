import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import { withCpuTiming } from "@/lib/api-timing";

// Per-club chat notification mute. Stored on the user record so the chat
// webhook (/api/clubs/chat/notify) can skip muted members when pushing.

function userMatch(id: string) {
  return {
    $or: [
      { id },
      ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : []),
    ],
  };
}

async function handleGet(request: NextRequest) {
  const user = await resolveSession(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = await getDb();
    const doc = await db
      .collection("user")
      .findOne(userMatch(user.id), { projection: { mutedClubChats: 1 } });
    const muted = Array.isArray(doc?.mutedClubChats) ? doc.mutedClubChats : [];
    return NextResponse.json({ muted: muted.map(String) });
  } catch {
    return NextResponse.json({ error: "Failed to load chat settings" }, { status: 500 });
  }
}

async function handlePost(request: NextRequest) {
  const user = await resolveSession(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json().catch(() => null);
    const slug = typeof data?.slug === "string" ? data.slug.trim().toLowerCase() : "";
    if (!/^[a-z0-9-]{2,64}$/.test(slug)) {
      return NextResponse.json({ error: "Invalid club" }, { status: 400 });
    }
    const muted = data?.muted === true;

    const db = await getDb();
    await db
      .collection("user")
      .updateOne(
        userMatch(user.id),
        muted
          ? { $addToSet: { mutedClubChats: slug } }
          : { $pull: { mutedClubChats: slug } },
      );

    return NextResponse.json({ slug, muted });
  } catch {
    return NextResponse.json({ error: "Failed to save chat settings" }, { status: 500 });
  }
}

export const GET = withCpuTiming("clubs/chat/mute.GET", handleGet);
export const POST = withCpuTiming("clubs/chat/mute.POST", handlePost);
