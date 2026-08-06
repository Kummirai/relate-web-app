import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession, resolveUser } from "@/lib/community-auth";
import { getAdminPushTokens, sendPushNotifications } from "@/lib/push";
import { notifyAdmins } from "@/lib/inapp-notify";

async function requireAdmin(request: NextRequest) {
  const userId = await resolveUser(request);
  if (!userId || !ObjectId.isValid(userId)) return null;
  const db = await getDb();
  const user = await db.collection("user").findOne({ _id: new ObjectId(userId) });
  if (!user || user.role !== "admin") return null;
  return userId;
}

export async function GET(request: NextRequest) {
  try {
    const adminId = await requireAdmin(request);
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const filter: Record<string, unknown> = {};
    if (status && ["open", "in_progress", "resolved", "archived"].includes(status)) {
      filter.status = status;
    }
    const requests = await db
      .collection("help_requests")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({ data: requests });
  } catch {
    return NextResponse.json({ error: "Failed to fetch help requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const email = typeof data.email === "string" ? data.email.trim() : "";
    const phone = typeof data.phone === "string" ? data.phone.trim() : "";
    const area = typeof data.area === "string" ? data.area.trim() : "";
    const ageGroup = typeof data.ageGroup === "string" ? data.ageGroup.trim() : "";
    const contactMethod =
      typeof data.contactMethod === "string" ? data.contactMethod.trim() : "";
    const urgency = typeof data.urgency === "string" ? data.urgency.trim() : "";
    const whoFor = typeof data.whoFor === "string" ? data.whoFor.trim() : "";
    const helpType = typeof data.helpType === "string" ? data.helpType.trim() : "";
    const description = typeof data.description === "string" ? data.description.trim() : "";
    if (!name || !helpType || !description) {
      return NextResponse.json(
        { error: "Name, help type and description are required" },
        { status: 400 },
      );
    }
    if (!phone && !email) {
      return NextResponse.json(
        { error: "A phone number or email is required so we can reach you" },
        { status: 400 },
      );
    }
    if (
      name.length > 200 ||
      helpType.length > 100 ||
      description.length > 5000 ||
      area.length > 200 ||
      ageGroup.length > 50 ||
      contactMethod.length > 50 ||
      urgency.length > 50 ||
      whoFor.length > 50
    ) {
      return NextResponse.json(
        { error: "Some fields exceed the maximum allowed length" },
        { status: 400 },
      );
    }
    const doc = {
      name,
      email,
      phone,
      area,
      ageGroup,
      contactMethod,
      urgency,
      whoFor,
      helpType,
      description,
      userId: user.id || null,
      status: "open",
      messages: [],
      recordId: null,
      lastUserReadAt: null,
      lastAdminReadAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("help_requests").insertOne(doc);

    void (async () => {
      try {
        const requestId = result.insertedId.toString();
        const tokens = await getAdminPushTokens(db);
        await sendPushNotifications(tokens, "New help request", `${name} · ${helpType}`, {
          type: "new_help_request",
          requestId,
        });
        await notifyAdmins(
          db,
          {
            type: "new_help_request",
            title: "New help request",
            body: `${name} · ${helpType}`,
            data: { requestId },
          },
          user.id,
        );
      } catch {}
    })();

    return NextResponse.json(
      { data: { _id: result.insertedId, ...doc } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to create help request" }, { status: 500 });
  }
}
