import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveSession, findUserById } from "@/lib/community-auth";

/**
 * The signed-in user's facilitator status (server truth): their latest
 * application, their role, and whether group creation is unlocked.
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDoc = await findUserById(db, user.id);
    const uid = userDoc?.id || userDoc?._id?.toString() || user.id;
    const application = await db
      .collection("facilitator_applications")
      .findOne({ userId: uid }, { sort: { createdAt: -1 } });

    const role = userDoc?.role || "user";
    return NextResponse.json({
      data: {
        application: application
          ? { ...application, _id: application._id.toString() }
          : null,
        role,
        facilitatorTrainingCompleted:
          role === "admin"
            ? true
            : userDoc?.facilitatorTrainingCompleted === true,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load facilitator status" },
      { status: 500 },
    );
  }
}
