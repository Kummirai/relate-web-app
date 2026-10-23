import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession, requireAdmin } from "@/lib/community-auth";
import {
  VOLUNTEER_OFFICES_COLLECTION,
  OFFICE_APPLICATIONS_COLLECTION,
  normalizeArea,
  parseBullets,
  serializeOffice,
} from "@/lib/volunteer-offices";

/**
 * One volunteer office.
 *
 *  - GET: detail (+ the caller's application if any).
 *  - PATCH: admin only — edit fields or run an action:
 *      fill    → office is taken (pending applications are left for review)
 *      reopen  → back to open for applications
 *      close   → retired from the board
 *  - DELETE: admin only — removes the office and its applications.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in to view" }, { status: 401 });
    }

    const office = await db
      .collection(VOLUNTEER_OFFICES_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
    if (!office) {
      return NextResponse.json({ error: "Office not found" }, { status: 404 });
    }

    const myApplication = await db
      .collection(OFFICE_APPLICATIONS_COLLECTION)
      .findOne({ officeId: id, userId: user.id });

    return NextResponse.json({
      data: { ...serializeOffice(office), myApplication: myApplication || null },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load office" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const db = await getDb();
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db
      .collection(VOLUNTEER_OFFICES_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ error: "Office not found" }, { status: 404 });
    }

    const body = await request.json();
    const action = typeof body.action === "string" ? body.action : null;
    const set: Record<string, any> = { updatedAt: new Date() };

    if (typeof body.title === "string" && body.title.trim()) set.title = body.title.trim();
    if (typeof body.description === "string" && body.description.trim()) {
      set.description = body.description.trim();
    }
    if (body.area !== undefined) set.area = normalizeArea(body.area);
    if (body.responsibilities !== undefined) {
      set.responsibilities = parseBullets(body.responsibilities);
    }
    if (body.qualifications !== undefined) {
      set.qualifications = parseBullets(body.qualifications);
    }
    if (body.applicationQuestions !== undefined) {
      set.applicationQuestions = parseBullets(body.applicationQuestions);
    }
    if (body.clubSlug !== undefined) {
      set.clubSlug =
        typeof body.clubSlug === "string" && body.clubSlug.trim()
          ? body.clubSlug.trim()
          : null;
    }

    if (action === "fill") {
      set.status = "filled";
    } else if (action === "reopen") {
      set.status = "open";
    } else if (action === "close") {
      set.status = "closed";
    } else if (action) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await db
      .collection(VOLUNTEER_OFFICES_COLLECTION)
      .updateOne({ _id: new ObjectId(id) }, { $set: set });

    const updated = await db
      .collection(VOLUNTEER_OFFICES_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ data: serializeOffice(updated) });
  } catch {
    return NextResponse.json({ error: "Failed to update office" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const db = await getDb();
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.collection(VOLUNTEER_OFFICES_COLLECTION).deleteOne({ _id: new ObjectId(id) });
    await db
      .collection(OFFICE_APPLICATIONS_COLLECTION)
      .deleteMany({ officeId: id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete office" }, { status: 500 });
  }
}
