import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession, ensureIndexes, fetchParticipants } from "@/lib/community-auth";

// Cache for the skills list (30s TTL).
let skillsCache: { data: any; ts: number } | null = null;
const SKILLS_TTL = 30_000; // 30 seconds

// Shared CDN cache: keeps the heavy list build from repeating on cold starts.
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30",
};

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    await ensureIndexes(db);
    const user = await resolveSession(request);
    const userId = user?.id || null;

    // Serve from cache if fresh enough.
    if (skillsCache && Date.now() - skillsCache.ts < SKILLS_TTL) {
      const data = skillsCache.data.map((s: any) => ({
        ...s,
        connected: userId ? s._connectedUserIds.includes(userId) : false,
        isOwner: userId ? s._ownerUserId === userId : false,
      }));
      return NextResponse.json(
        { data },
        { headers: CACHE_HEADERS },
      );
    }

    const skills = await db
      .collection("community_skills")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const skillIds = skills.map((s: any) => s._id.toString());

    const allConnections = await db
      .collection("community_skill_connections")
      .find({ skillId: { $in: skillIds } })
      .toArray();

    const connectedIds = userId ? allConnections.filter((c: any) => c.userId === userId).map((c: any) => c.skillId) : [];

    const allConnectorUserIds = allConnections.map((c: any) => c.userId);
    const participants = await fetchParticipants(db, allConnectorUserIds);

    const connectionsBySkill = new Map<string, string[]>();
    for (const c of allConnections) {
      const list = connectionsBySkill.get(c.skillId) || [];
      list.push(c.userId);
      connectionsBySkill.set(c.skillId, list);
    }

    const data = skills.map((s: any) => {
      const sid = s._id.toString();
      const connectorIds = connectionsBySkill.get(sid) || [];
      const connectedUsers = connectorIds.map((id) => participants.get(id)).filter(Boolean);
      return {
        _id: s._id,
        title: s.title,
        category: s.category,
        description: s.description,
        author: s.author,
        offering: s.offering,
        connectionCount: connectorIds.length,
        connectedUsers,
        createdAt: s.createdAt,
        // Store raw IDs for cache re-derivation.
        _connectedUserIds: connectorIds,
        _ownerUserId: s.userId || null,
        _ownerAuthor: s.author || null,
      };
    });

    skillsCache = { data, ts: Date.now() };

    // Re-derive user-specific fields.
    const response = data.map((s: any) => ({
      ...s,
      connected: userId ? s._connectedUserIds.includes(userId) : false,
      isOwner: userId ? s._ownerUserId === userId : false,
    }));
    return NextResponse.json({ data: response }, { headers: CACHE_HEADERS });
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
      category: data.category || "",
      description: data.description || "",
      offering: data.offering ?? true,
      author: data.author || "Anonymous",
      userId: userId || null,
      createdAt: new Date(),
    };
    const result = await db.collection("community_skills").insertOne(doc);
    skillsCache = null; // Invalidate cache
    return NextResponse.json(
      { data: { _id: result.insertedId, ...doc, connected: false, connectionCount: 0, isOwner: !!userId } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to create skill" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { _id, ...updateData } = await request.json();
    if (!ObjectId.isValid(_id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await db.collection("community_skills").findOne({ _id: new ObjectId(_id) });
    if (!existing) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

    const canEdit = existing.userId === user.id || (!existing.userId && !!user.name && existing.author === user.name);
    if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const setFields: Record<string, any> = { updatedAt: new Date() };
    if (updateData.title !== undefined) setFields.title = updateData.title;
    if (updateData.description !== undefined) setFields.description = updateData.description;
    if (updateData.category !== undefined) setFields.category = updateData.category;
    if (updateData.offering !== undefined) setFields.offering = updateData.offering;

    await db.collection("community_skills").updateOne(
      { _id: new ObjectId(_id) },
      { $set: setFields },
    );
    skillsCache = null; // Invalidate cache

    const updated = await db.collection("community_skills").findOne({ _id: new ObjectId(_id) });
    return NextResponse.json({ data: { ...updated, isOwner: true } });
  } catch {
    return NextResponse.json({ error: "Failed to update skill" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { _id } = await request.json();
    if (!ObjectId.isValid(_id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await db.collection("community_skills").findOne({ _id: new ObjectId(_id) });
    if (!existing) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

    const canDelete = existing.userId === user.id || (!existing.userId && !!user.name && existing.author === user.name);
    if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.collection("community_skills").deleteOne({ _id: new ObjectId(_id) });
    await db.collection("community_skill_connections").deleteMany({ skillId: _id });
    skillsCache = null; // Invalidate cache
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete skill" }, { status: 500 });
  }
}
