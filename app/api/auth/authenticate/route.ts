import { NextRequest, NextResponse } from "next/server";
import { generateAuthOptions, verifyAuthResponse } from "@/lib/auth/webauthn";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.step === "init") {
    const options = await generateAuthOptions(body.allowCredentials);
    return NextResponse.json({ options });
  }

  if (body.step === "verify") {
    const { credential } = body;
    if (!credential) {
      return NextResponse.json({ error: "Missing credential" }, { status: 400 });
    }

    const { verification, userId } = await verifyAuthResponse(credential);
    if (!verification.verified) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    await createSession(userId);
    return NextResponse.json({ verified: true, userId });
  }

  return NextResponse.json({ error: "Invalid step" }, { status: 400 });
}
