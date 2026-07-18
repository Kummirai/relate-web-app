import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveUser } from "@/lib/community-auth";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const userId = await resolveUser(request);
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

    const data = jobs.map((j: any) => ({
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
      createdAt: j.createdAt,
    }));
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const data = await request.json();
    const doc = {
      title: data.title,
      company: data.company,
      location: data.location,
      type: data.type || "Full-time",
      description: data.description,
      category: data.category || "",
      salary: data.salary || "",
      contactEmail: data.contactEmail || "",
      author: data.author || "Anonymous",
      createdAt: new Date(),
    };
    const result = await db.collection("community_jobs").insertOne(doc);
    return NextResponse.json(
      { data: { _id: result.insertedId, ...doc, applied: false } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
