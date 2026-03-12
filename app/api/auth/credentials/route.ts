import { NextResponse } from "next/server";
import { db } from "@/db";
import { passkeyCredentials } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  // Return all credential IDs so the client can pass them to startAuthentication
  const creds = await db
    .select({ id: passkeyCredentials.id, transports: passkeyCredentials.transports })
    .from(passkeyCredentials);

  return NextResponse.json({
    credentials: creds.map((c) => ({
      id: c.id,
      transports: c.transports ? JSON.parse(c.transports) : ["internal"],
    })),
  });
}
