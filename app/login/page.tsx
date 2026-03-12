"use client";

import { useState } from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasskey() {
    setLoading(true);
    setError(null);

    try {
      // Check if any passkeys exist on the server
      const credsRes = await fetch("/api/auth/credentials");
      const { credentials } = await credsRes.json();

      if (credentials.length > 0) {
        // Existing passkeys — authenticate with allowCredentials
        await signIn(credentials);
      } else {
        // No passkeys — create new account
        await createAccount();
      }

      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      // Don't show error if user just cancelled
      if (!msg.includes("NotAllowed") && !msg.includes("AbortError")) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function signIn(allowCredentials: { id: string; transports?: string[] }[]) {
    const initRes = await fetch("/api/auth/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "init", allowCredentials }),
    });
    const { options } = await initRes.json();
    if (!initRes.ok) throw new Error("Failed to start authentication");

    const credential = await startAuthentication({ optionsJSON: options });

    const verifyRes = await fetch("/api/auth/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "verify", credential }),
    });
    if (!verifyRes.ok) throw new Error("Passkey verification failed");
  }

  async function createAccount() {
    const username = `user_${crypto.randomUUID().slice(0, 8)}`;

    const initRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "init", username }),
    });
    const { options, userId } = await initRes.json();
    if (!initRes.ok) throw new Error("Registration failed");

    const credential = await startRegistration({ optionsJSON: options });

    const verifyRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "verify", userId, credential }),
    });
    if (!verifyRes.ok) {
      const data = await verifyRes.json();
      throw new Error(data.error || "Registration failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Pay Wallet</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Non-custodial stablecoin wallet
          </p>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handlePasskey}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Continue with Passkey
        </Button>

        {error && (
          <p className="text-center text-sm text-[var(--destructive)]">{error}</p>
        )}

      </Card>
    </div>
  );
}
