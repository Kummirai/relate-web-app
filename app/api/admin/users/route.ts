import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/community-auth";

function uidOf(doc: any): string {
  return doc?.id || doc?._id?.toString() || "";
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const filter: any = {};
    if (search.length >= 2) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const users = await db
      .collection("user")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .project({ id: 1, name: 1, email: 1, role: 1, createdAt: 1 })
      .toArray();

    const data = users.map((u: any) => ({
      id: uidOf(u),
      name: u.name || "Unknown",
      email: u.email || "",
      role: u.role || "user",
      createdAt: u.createdAt || null,
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
