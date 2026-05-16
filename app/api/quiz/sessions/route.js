import { NextResponse } from "next/server";
import { getSessions } from "@/lib/quiz";

export async function GET() {
  try {
    const data = await getSessions();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
