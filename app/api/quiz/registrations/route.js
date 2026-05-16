import { NextResponse } from "next/server";
import { getRegistrations } from "@/lib/quiz";

export async function GET() {
  try {
    const registrations = await getRegistrations();
    return NextResponse.json(registrations);
  } catch (error) {
    console.error("Failed to fetch registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 },
    );
  }
}
