import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(users);
  return NextResponse.json({ hasUsers: Number(result.count) > 0 });
}
