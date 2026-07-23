import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveUser } from "@/lib/community-auth";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const [userId, session] = await Promise.all([
      resolveUser(request),
      auth.api.getSession({ headers: request.headers }).catch(() => null),
    ]);
    const userName = session?.user?.name || null;

    const jobs = await db
      .collection("community_jobs")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    let appliedIds: string[] = [];
    if (userId) {
      const applications = await db
        .collection("community_job_applications")
        .find({ userId })
        .toArray();
      appliedIds = applications.map((a: any) => a.jobId);
    }

    const data = await Promise.all(jobs.map(async (j: any) => {
      const applicationCount = await db
        .collection("community_job_applications")
        .countDocuments({ jobId: j._id.toString() });

      return {
        _id: j._id,
        title: j.title,
        company: j.company,
        location: j.location,
        type: j.type || "Full-time",
        description: j.description,
        category: j.category,
        salary: j.salary || "",
        contactEmail: j.contactEmail || "",
        author: j.author,
        applied: appliedIds.includes(j._id.toString()),
        applicationCount,
        isOwner: userId
          ? j.userId === userId || (!j.userId && !!userName && j.author === userName)
          : false,
        createdAt: j.createdAt,
      };
    }));
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const userId = await resolveUser(request);
    const data = await request.json();
    const doc = {
      title: data.title,
      company: data.company || "",
      location: data.location || "",
      type: data.type || "Full-time",
      description: data.description || "",
      category: data.category || "",
      salary: data.salary || "",
      contactEmail: data.contactEmail || "",
      author: data.author || "Anonymous",
      userId: userId || null,
      createdAt: new Date(),
    };
    const result = await db.collection("community_jobs").insertOne(doc);
    return NextResponse.json(
      { data: { _id: result.insertedId, ...doc, applied: false, applicationCount: 0, isOwner: !!userId } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const [userId, session] = await Promise.all([
      resolveUser(request),
      auth.api.getSession({ headers: request.headers }).catch(() => null),
    ]);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userName = session?.user?.name || null;

    const { _id, ...updateData } = await request.json();
    if (!ObjectId.isValid(_id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await db.collection("community_jobs").findOne({ _id: new ObjectId(_id) });
    if (!existing) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const canEdit = existing.userId === userId || (!existing.userId && !!userName && existing.author === userName);
    if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const setFields: Record<string, any> = { updatedAt: new Date() };
    if (updateData.title !== undefined) setFields.title = updateData.title;
    if (updateData.description !== undefined) setFields.description = updateData.description;
    if (updateData.company !== undefined) setFields.company = updateData.company;
    if (updateData.location !== undefined) setFields.location = updateData.location;
    if (updateData.type !== undefined) setFields.type = updateData.type;
    if (updateData.category !== undefined) setFields.category = updateData.category;
    if (updateData.salary !== undefined) setFields.salary = updateData.salary;
    if (updateData.contactEmail !== undefined) setFields.contactEmail = updateData.contactEmail;

    await db.collection("community_jobs").updateOne(
      { _id: new ObjectId(_id) },
      { $set: setFields },
    );

    const updated = await db.collection("community_jobs").findOne({ _id: new ObjectId(_id) });
    return NextResponse.json({ data: { ...updated, isOwner: true } });
  } catch {
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    const [userId, session] = await Promise.all([
      resolveUser(request),
      auth.api.getSession({ headers: request.headers }).catch(() => null),
    ]);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userName = session?.user?.name || null;

    const { _id } = await request.json();
    if (!ObjectId.isValid(_id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await db.collection("community_jobs").findOne({ _id: new ObjectId(_id) });
    if (!existing) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const canDelete = existing.userId === userId || (!existing.userId && !!userName && existing.author === userName);
    if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.collection("community_jobs").deleteOne({ _id: new ObjectId(_id) });
    await db.collection("community_job_applications").deleteMany({ jobId: _id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}
