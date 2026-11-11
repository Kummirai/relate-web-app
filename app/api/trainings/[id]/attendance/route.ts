import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { findUserById, requireAdmin } from "@/lib/community-auth";
import { pickText } from "@/lib/board-governance";
import {
  isTrainingAttendanceStatus,
  serializeTraining,
} from "@/lib/trainings";

/**
 * Board member: record the signed-in admin's attendance for a training.
 *
 * PATCH /api/trainings/[id]/attendance
 *   { status: "ATTENDING" | "NOT_ATTENDING", reason?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid training" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const status = body?.status;
    if (!isTrainingAttendanceStatus(status)) {
      return NextResponse.json(
        { error: "Choose attending or not attending" },
        { status: 400 },
      );
    }
    const reason = typeof body?.reason === "string" ? pickText(body.reason, 500) : null;

    const db = await getDb();
    const trainings = db.collection("trainings");
    const training = await trainings.findOne({ _id: new ObjectId(id) });
    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    const attendance = Array.isArray(training.attendance) ? training.attendance : [];
    const alreadyListed = attendance.some((entry: any) => entry.userId === admin.id);

    if (alreadyListed) {
      const updates: Record<string, unknown> = {
        "attendance.$[member].status": status,
        updatedAt: new Date(),
      };
      if (status === "ATTENDING" || reason !== null) {
        updates["attendance.$[member].reason"] =
          status === "NOT_ATTENDING" ? reason || "" : "";
      }
      await trainings.updateOne(
        { _id: training._id },
        { $set: updates },
        { arrayFilters: [{ "member.userId": admin.id }] },
      );
    } else {
      const user = await findUserById(db, admin.id);
      await trainings.updateOne(
        { _id: training._id },
        {
          $push: {
            attendance: {
              userId: admin.id,
              name: user?.name || admin.name || "Board member",
              role: user?.role || "admin",
              status,
              reason: status === "NOT_ATTENDING" ? reason || "" : "",
            },
          },
          $set: { updatedAt: new Date() },
        } as any,
      );
    }

    const updated = await trainings.findOne({ _id: training._id });
    return NextResponse.json({ data: serializeTraining(updated) });
  } catch {
    return NextResponse.json(
      { error: "Failed to save your attendance" },
      { status: 500 },
    );
  }
}
