import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Terminal API coming soon" }, { status: 501 });
}
