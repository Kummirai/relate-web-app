import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession, ensureIndexes, fetchParticipants } from "@/lib/community-auth";
import {
  SUMMARY_CACHE_HEADERS,
  isSummaryView,
  readProjected,
} from "@/lib/card-view";

// Activity-list payload: title, the company/place line, an applicant count and
// the viewer's own flags.
const JOB_SUMMARY_FIELDS = {
  title: 1,
  company: 1,
  location: 1,
  author: 1,
  createdAt: 1,
  userId: 1,
} as const;

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    await ensureIndexes(db);
    const user = await resolveSession(request);
    const userId = user?.id || null;

    // Counts and the viewer's own flag arrive as one row per job, so no
    // application document or applicant profile is ever fetched.
    if (isSummaryView(request)) {
      const rows = await readProjected(
        db,
        "community_jobs",
        request,
        JOB_SUMMARY_FIELDS,
      );
      const counts = await db
        .collection("community_job_applications")
        .aggregate([
          { $match: { jobId: { $in: rows.map((j: any) => j._id.toString()) } } },
          {
            $group: {
              _id: "$jobId",
              count: { $sum: 1 },
              mine: {
                $sum: { $cond: [{ $eq: ["$userId", userId] }, 1, 0] },
              },
            },
          },
        ])
        .toArray();
      const byJob = new Map<string, any>(counts.map((c: any) => [c._id, c]));
      const data = rows.map((j: any) => {
        const agg = byJob.get(j._id.toString());
        return {
          _id: j._id,
          title: j.title,
          company: j.company,
          location: j.location,
          author: j.author,
          createdAt: j.createdAt,
          applicationCount: agg?.count || 0,
          applied: userId ? (agg?.mine || 0) > 0 : false,
          isOwner: userId
            ? j.userId === userId ||
              (!j.userId && !!user.name && j.author === user.name)
            : false,
        };
      });
      return NextResponse.json({ data }, { headers: SUMMARY_CACHE_HEADERS });
    }

    const jobs = await db
      .collection("community_jobs")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const jobIds = jobs.map((j: any) => j._id.toString());

    const allApplications = await db
      .collection("community_job_applications")
      .find({ jobId: { $in: jobIds } })
      .toArray();

    const appliedIds = userId ? allApplications.filter((a: any) => a.userId === userId).map((a: any) => a.jobId) : [];

    const allApplicantUserIds = allApplications.map((a: any) => a.userId);
    const participants = await fetchParticipants(db, allApplicantUserIds);

    const applicationsByJob = new Map<string, string[]>();
    for (const a of allApplications) {
      const list = applicationsByJob.get(a.jobId) || [];
      list.push(a.userId);
      applicationsByJob.set(a.jobId, list);
    }

    const data = jobs.map((j: any) => {
      const jid = j._id.toString();
      const applicantIds = applicationsByJob.get(jid) || [];
      const applicants = applicantIds.map((id) => participants.get(id)).filter(Boolean);
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
        applied: appliedIds.includes(jid),
        applicationCount: applicantIds.length,
        applicants,
        isOwner: userId
          ? j.userId === userId || (!j.userId && !!user.name && j.author === user.name)
          : false,
        createdAt: j.createdAt,
      };
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await resolveSession(request);
    const userId = user?.id || null;
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
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;
    const userName = user.name;

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
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;
    const userName = user.name;

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
