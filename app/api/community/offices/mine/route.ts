import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession } from "@/lib/community-auth";
import {
  VOLUNTEER_OFFICES_COLLECTION,
  OFFICE_APPLICATIONS_COLLECTION,
  serializeApplication,
} from "@/lib/volunteer-offices";

/**
 * The signed-in member's office applications, newest first, each joined
 * with its office (status + description) for the "My applications" view.
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in" }, { status: 401 });
    }

    const apps = await db
      .collection(OFFICE_APPLICATIONS_COLLECTION)
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const officeIds: string[] = [
      ...new Set<string>(apps.map((a: any) => String(a.officeId))),
    ].filter((oid) => oid && ObjectId.isValid(oid));
    const offices = officeIds.length
      ? await db
          .collection(VOLUNTEER_OFFICES_COLLECTION)
          .find({ _id: { $in: officeIds.map((oid) => new ObjectId(oid)) } })
          .toArray()
      : [];
    const officeById = new Map<string, any>(
      offices.map((o: any) => [o._id.toString(), o]),
    );

    return NextResponse.json({
      data: apps.map((a: any) => {
        const office = officeById.get(String(a.officeId));
        return {
          ...serializeApplication(a),
          office: office
            ? {
                _id: office._id.toString(),
                title: office.title,
                description: office.description,
                area: office.area ?? null,
                status: office.status,
                clubSlug: office.clubSlug ?? null,
              }
            : null,
        };
      }),
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
