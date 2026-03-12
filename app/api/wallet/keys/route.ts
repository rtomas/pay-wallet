import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/db";
import { encryptedWallets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decryptMnemonic, encryptMnemonic } from "@/lib/crypto/serverEncryption";
import { generateMnemonic } from "@/lib/crypto/keyDerivation";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let [wallet] = await db
    .select()
    .from(encryptedWallets)
    .where(eq(encryptedWallets.userId, session.userId))
    .limit(1);

  // If no wallet exists yet (e.g. account created before wallet feature), create one
  if (!wallet) {
    const mnemonic = generateMnemonic();
    const encrypted = encryptMnemonic(mnemonic);
    [wallet] = await db
      .insert(encryptedWallets)
      .values({ userId: session.userId, iv: encrypted.iv, ciphertext: encrypted.ciphertext })
      .returning();
  }

  const mnemonic = decryptMnemonic(wallet.iv, wallet.ciphertext);
  return NextResponse.json({ mnemonic });
}
