import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALG = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.WALLET_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("WALLET_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

export function encryptMnemonic(mnemonic: string): { iv: string; ciphertext: string } {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(mnemonic, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    ciphertext: Buffer.concat([encrypted, authTag]).toString("base64"),
  };
}

export function decryptMnemonic(iv: string, ciphertext: string): string {
  const key = getKey();
  const ivBuf = Buffer.from(iv, "base64");
  const data = Buffer.from(ciphertext, "base64");

  const authTag = data.subarray(data.length - 16);
  const encrypted = data.subarray(0, data.length - 16);

  const decipher = createDecipheriv(ALG, key, ivBuf);
  decipher.setAuthTag(authTag);

  return decipher.update(encrypted) + decipher.final("utf8");
}
