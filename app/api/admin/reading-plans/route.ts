import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import {
  READING_PLANS,
  getPlanSections,
} from "@/lib/reading-plans";
import { normalizePlanInput } from "@/lib/reading-plans-admin";
import type { ReadingPlanDoc } from "@/lib/reading-plans-admin";

/**
 * Admin reading plans API.
 * GET  /api/admin/reading-plans  — catalog + authored plans (drafts included)
 * POST /api/admin/reading-plans  — create an authored plan (409 if slug exists)
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db = await getDb();
    const col = db.collection("reading_plans");
    const authored = await col.find({}).sort({ sort: 1, days: 1 }).toArray();

    const bySlug = new Map<string, Record<string, unknown>>();
    for (const plan of READING_PLANS) {
      bySlug.set(plan.slug, {
        ...plan,
        status: "published",
        source: "catalog",
        sectionsCount: getPlanSections(plan).length,
      });
    }
    for (const doc of authored) {
      bySlug.set(doc.slug, {
        slug: doc.slug,
        title: doc.title,
        tagline: doc.tagline,
        description: doc.description,
        category: doc.category,
        section: doc.section,
        days: doc.days,
        gradient: doc.gradient,
        image: doc.image,
        status: doc.status || "draft",
        source: "db",
        sort: doc.sort ?? 0,
        updatedAt: doc.updatedAt ?? null,
        sectionsCount: Array.isArray(doc.sections) ? doc.sections.length : 0,
        sections: Array.isArray(doc.sections) ? doc.sections : [],
      });
    }
    return NextResponse.json({ data: [...bySlug.values()] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch reading plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const payload = await request.json();
    const slug = typeof payload.slug === "string" ? payload.slug.trim() : "";
    const normalized = normalizePlanInput(slug, payload);
    if ("error" in normalized) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection("reading_plans");
    const existing = await col.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: `"${slug}" already exists — edit it instead.` },
        { status: 409 },
      );
    }

    const doc: ReadingPlanDoc = { ...normalized.doc, createdAt: new Date() };
    await col.insertOne(doc);
    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create reading plan" }, { status: 500 });
  }
}
