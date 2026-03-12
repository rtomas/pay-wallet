"use client";

import { useEffect, useState } from "react";
import { BalanceCard } from "@/components/BalanceCard";
import { ActionButtons } from "@/components/ActionButtons";
import { TokenList } from "@/components/TokenList";
import { useWallet } from "@/lib/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { isUnlocked, setKeys, clearKeys } = useWallet();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isUnlocked) {
      setLoading(false);
      return;
    }

    async function loadWallet() {
      try {
        const res = await fetch("/api/wallet/keys");
        if (!res.ok) throw new Error("Failed to load wallet");
        const { mnemonic } = await res.json();
        const { deriveAllKeys } = await import("@/lib/crypto/keyDerivation");
        const keys = await deriveAllKeys(mnemonic);
        setKeys(keys);
      } catch {
        setError("Failed to load wallet");
      } finally {
        setLoading(false);
      }
    }

    loadWallet();
  }, [isUnlocked, setKeys]);

  async function handleLogout() {
    clearKeys();
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 text-center py-20">
        <p className="text-sm text-[var(--destructive)]">{error}</p>
        <Button variant="ghost" onClick={handleLogout}>
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Pay Wallet</h1>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <BalanceCard />
      <ActionButtons />
      <TokenList />
    </div>
  );
}
