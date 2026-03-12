import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import nacl from "tweetnacl";

const EVM_PATH = "m/44'/60'/0'/0/0";
const SOLANA_PATH = "m/44'/501'/0'/0'";

export async function deriveEncryptionKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 600000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(
  key: CryptoKey,
  data: string
): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(data)
  );

  return {
    iv: Buffer.from(iv).toString("base64"),
    ciphertext: Buffer.from(ciphertext).toString("base64"),
  };
}

export async function decryptData(
  key: CryptoKey,
  iv: string,
  ciphertext: string
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: Buffer.from(iv, "base64") },
    key,
    Buffer.from(ciphertext, "base64")
  );

  return new TextDecoder().decode(decrypted);
}

export function generateMnemonic(): string {
  return bip39.generateMnemonic(128);
}

export async function deriveEVMPrivateKey(mnemonic: string): Promise<Uint8Array> {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  // Simple BIP-32 derivation for EVM - use first 32 bytes of HMAC-derived key
  const { createHmac } = await import("crypto");
  let key = createHmac("sha512", "Bitcoin seed").update(seed).digest();

  const segments = EVM_PATH.replace("m/", "").split("/");
  for (const segment of segments) {
    const hardened = segment.endsWith("'");
    const index = parseInt(segment.replace("'", ""), 10) + (hardened ? 0x80000000 : 0);

    const data = Buffer.alloc(37);
    data[0] = 0x00;
    key.copy(data, 1, 0, 32);
    data.writeUInt32BE(index, 33);

    key = createHmac("sha512", key.subarray(32)).update(data).digest();
  }

  return new Uint8Array(key.subarray(0, 32));
}

export async function deriveSolanaKeypair(
  mnemonic: string
): Promise<nacl.SignKeyPair> {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const { key } = derivePath(SOLANA_PATH, Buffer.from(seed).toString("hex"));
  return nacl.sign.keyPair.fromSeed(new Uint8Array(key));
}

export interface DerivedKeys {
  mnemonic: string;
  evmPrivateKey: Uint8Array;
  solanaKeypair: nacl.SignKeyPair;
}

export async function deriveAllKeys(mnemonic: string): Promise<DerivedKeys> {
  const [evmPrivateKey, solanaKeypair] = await Promise.all([
    deriveEVMPrivateKey(mnemonic),
    deriveSolanaKeypair(mnemonic),
  ]);

  return { mnemonic, evmPrivateKey, solanaKeypair };
}
