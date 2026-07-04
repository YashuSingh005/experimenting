import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Chat history API coming soon" }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ message: "Chat delete API coming soon" }, { status: 501 });
}
