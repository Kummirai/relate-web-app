import { NextResponse } from "next/server";
import { getBooks } from "@/lib/quiz";

export async function GET() {
  try {
    const data = await getBooks();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch books:", error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}
