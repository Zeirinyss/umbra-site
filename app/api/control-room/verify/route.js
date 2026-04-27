import { NextResponse } from "next/server";

export async function POST(request) {
  const { code } = await request.json();

  if (!code || code !== process.env.CONTROL_ROOM_CODE) {
    return NextResponse.json(
      { error: "Invalid control room code." },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true });
}