import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";

export async function GET() {
  const rpID = process.env.WEBAUTHN_RP_ID || process.env.VERCEL_PROJECT_PRODUCTION_URL || "localhost";
  const rpName = process.env.WEBAUTHN_RP_NAME || "Pay Wallet";

  // Generate sample options to see exactly what the browser receives
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: "debug-test",
    userID: new TextEncoder().encode("debug"),
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required",
    },
  });

  return NextResponse.json({
    env: {
      WEBAUTHN_RP_ID: process.env.WEBAUTHN_RP_ID || "(not set)",
      WEBAUTHN_ORIGIN: process.env.WEBAUTHN_ORIGIN || "(not set)",
    },
    rpInOptions: options.rp,
    authenticatorSelection: options.authenticatorSelection,
    fullOptions: options,
  });
}
