import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };

  const expected = process.env.AUTH_PASSWORD;

  if (!expected || expected.trim() === "") {
    return NextResponse.json({ error: "Authentication is not configured" }, { status: 500 });
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
