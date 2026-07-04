import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "User detail API coming soon" }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ message: "User delete API coming soon" }, { status: 501 });
}

export async function PATCH() {
  return NextResponse.json({ message: "User update API coming soon" }, { status: 501 });
}
