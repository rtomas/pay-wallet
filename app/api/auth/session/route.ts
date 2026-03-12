import { NextResponse } from "next/server";
import { getSession, clearSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, userId: session.userId });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ success: true });
}
