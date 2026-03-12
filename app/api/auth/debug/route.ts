import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    WEBAUTHN_RP_ID: process.env.WEBAUTHN_RP_ID || "(not set)",
    WEBAUTHN_ORIGIN: process.env.WEBAUTHN_ORIGIN || "(not set)",
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL || "(not set)",
    VERCEL_URL: process.env.VERCEL_URL || "(not set)",
  });
}
