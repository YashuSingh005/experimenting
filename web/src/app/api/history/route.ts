import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "History API coming soon" }, { status: 501 });
}
