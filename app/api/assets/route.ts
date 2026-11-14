import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";
import { buildAsset } from "@/lib/assets";

const COLLECTION = "assets";

function serialize(doc: any) {
  return {
    _id: doc._id.toString(),
    name: doc.name ?? "",
    category: doc.category ?? "Other",
    description: doc.description ?? "",
    year: typeof doc.year === "number" ? doc.year : null,
    model: doc.model ?? "",
    serialNumber: doc.serialNumber ?? "",
    createdBy: doc.createdBy ?? null,
    createdByName: doc.createdByName ?? null,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

/** Admin-only register of the equipment Relate World owns. */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const docs = await db
      .collection(COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    return NextResponse.json({ data: docs.map(serialize) });
  } catch {
    return NextResponse.json(
      { error: "Failed to load assets" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const asset = buildAsset(await request.json());
    if (!asset.name) {
      return NextResponse.json({ error: "Asset name is required" }, { status: 400 });
    }

    const now = new Date();
    const doc = {
      ...asset,
      createdBy: admin.id,
      createdByName: admin.name,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();
    const result = await db.collection(COLLECTION).insertOne(doc);
    return NextResponse.json(
      { data: serialize({ ...doc, _id: result.insertedId }) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ...body } = await request.json();
    if (!id || !ObjectId.isValid(String(id))) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const asset = buildAsset(body);
    if (!asset.name) {
      return NextResponse.json({ error: "Asset name is required" }, { status: 400 });
    }

    const db = await getDb();
    const _id = new ObjectId(String(id));
    const result = await db
      .collection(COLLECTION)
      .updateOne({ _id }, { $set: { ...asset, updatedAt: new Date() } });
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const doc = await db.collection(COLLECTION).findOne({ _id });
    return NextResponse.json({ data: serialize(doc) });
  } catch {
    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id || !ObjectId.isValid(String(id))) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(String(id)) });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 },
    );
  }
}