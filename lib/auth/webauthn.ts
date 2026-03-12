import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
type AuthenticatorTransportFuture = 'ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb';
import { db } from "@/db";
import { passkeyCredentials, users, webauthnChallenges } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

const rpName = process.env.WEBAUTHN_RP_NAME || "Pay Wallet";

function getRpID(): string {
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (process.env.VERCEL_URL) return process.env.VERCEL_URL;
  return "localhost";
}

function getOrigin(): string {
  if (process.env.WEBAUTHN_ORIGIN) return process.env.WEBAUTHN_ORIGIN;
  const rpID = getRpID();
  if (rpID === "localhost") return "http://localhost:3000";
  return `https://${rpID}`;
}

const rpID = getRpID();
const origin = getOrigin();

export async function generateRegOptions(username: string) {
  // Check if user exists
  let [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

  if (!user) {
    [user] = await db.insert(users).values({ username }).returning();
  }

  // Get existing credentials for this user
  const existingCreds = await db
    .select()
    .from(passkeyCredentials)
    .where(eq(passkeyCredentials.userId, user.id));

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: username,
    userID: new TextEncoder().encode(user.id),
    attestationType: "none",
    excludeCredentials: existingCreds.map((cred) => ({
      id: cred.id,
      transports: cred.transports
        ? (JSON.parse(cred.transports) as AuthenticatorTransportFuture[])
        : undefined,
    })),
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required",
    },
  });

  // Store challenge
  await db.insert(webauthnChallenges).values({
    challenge: options.challenge,
    userId: user.id,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  return { options, userId: user.id };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function verifyRegResponse(userId: string, response: any) {
  // Get latest challenge for user
  const [challengeRecord] = await db
    .select()
    .from(webauthnChallenges)
    .where(
      and(
        eq(webauthnChallenges.userId, userId),
        gt(webauthnChallenges.expiresAt, new Date())
      )
    )
    .orderBy(webauthnChallenges.createdAt)
    .limit(1);

  if (!challengeRecord) {
    throw new Error("Challenge not found or expired");
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challengeRecord.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (verification.verified && verification.registrationInfo) {
    const { credential } = verification.registrationInfo;
    await db.insert(passkeyCredentials).values({
      id: credential.id,
      userId,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: String(credential.counter),
      transports: response.response.transports
        ? JSON.stringify(response.response.transports)
        : null,
    });

    // Clean up challenge
    await db
      .delete(webauthnChallenges)
      .where(eq(webauthnChallenges.id, challengeRecord.id));
  }

  return verification;
}

export async function generateAuthOptions() {
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
  });

  await db.insert(webauthnChallenges).values({
    challenge: options.challenge,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  return options;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function verifyAuthResponse(response: any) {
  const credentialId = response.id;

  const [credential] = await db
    .select()
    .from(passkeyCredentials)
    .where(eq(passkeyCredentials.id, credentialId))
    .limit(1);

  if (!credential) {
    throw new Error("Credential not found");
  }

  // Find matching challenge
  const [challengeRecord] = await db
    .select()
    .from(webauthnChallenges)
    .where(gt(webauthnChallenges.expiresAt, new Date()))
    .orderBy(webauthnChallenges.createdAt)
    .limit(1);

  if (!challengeRecord) {
    throw new Error("Challenge not found or expired");
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challengeRecord.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: credential.id,
      publicKey: new Uint8Array(Buffer.from(credential.publicKey, "base64url")),
      counter: Number(credential.counter),
      transports: credential.transports
        ? (JSON.parse(credential.transports) as AuthenticatorTransportFuture[])
        : undefined,
    },
  });

  if (verification.verified) {
    // Update counter
    await db
      .update(passkeyCredentials)
      .set({ counter: String(verification.authenticationInfo.newCounter) })
      .where(eq(passkeyCredentials.id, credentialId));

    // Clean up challenge
    await db
      .delete(webauthnChallenges)
      .where(eq(webauthnChallenges.id, challengeRecord.id));
  }

  return { verification, userId: credential.userId };
}
