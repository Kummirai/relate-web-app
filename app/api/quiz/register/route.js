import { NextResponse } from "next/server";
import { insertRegistration } from "@/lib/quiz";

export async function POST(request) {
  try {
    const data = await request.json();
    const result = await insertRegistration(data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Quiz registration error:", error);
    return NextResponse.json(
      { error: "Failed to register team" },
      { status: 500 },
    );
  }
}
