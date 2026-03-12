import { NextRequest, NextResponse } from "next/server";
import { generateRegOptions, verifyRegResponse } from "@/lib/auth/webauthn";
import { createSession } from "@/lib/auth/session";
import { generateMnemonic } from "@/lib/crypto/keyDerivation";
import { encryptMnemonic } from "@/lib/crypto/serverEncryption";
import { db } from "@/db";
import { encryptedWallets } from "@/db/schema";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Step 1: Generate registration options
  if (body.step === "init") {
    const { username } = body;
    if (!username || typeof username !== "string" || username.length < 3) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    const { options, userId } = await generateRegOptions(username);
    return NextResponse.json({ options, userId });
  }

  // Step 2: Verify registration & create wallet
  if (body.step === "verify") {
    const { userId, credential } = body;
    if (!userId || !credential) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const verification = await verifyRegResponse(userId, credential);
    if (!verification.verified) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    // Generate and encrypt wallet for this user
    const mnemonic = generateMnemonic();
    const { iv, ciphertext } = encryptMnemonic(mnemonic);
    await db.insert(encryptedWallets).values({ userId, iv, ciphertext });

    await createSession(userId);
    return NextResponse.json({ verified: true });
  }

  return NextResponse.json({ error: "Invalid step" }, { status: 400 });
}
