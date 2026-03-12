"use client";

import { useState } from "react";
import { BalanceCard } from "@/components/BalanceCard";
import { ActionButtons } from "@/components/ActionButtons";
import { TokenList } from "@/components/TokenList";
import { useWallet } from "@/lib/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LogOut, Lock, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { isUnlocked, setKeys, clearKeys } = useWallet();
  const [mnemonic, setMnemonic] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const router = useRouter();

  async function handleUnlock() {
    if (!mnemonic.trim()) return;
    setUnlocking(true);
    try {
      const { deriveAllKeys } = await import("@/lib/crypto/keyDerivation");
      const keys = await deriveAllKeys(mnemonic.trim());
      setKeys(keys);
      setMnemonic("");
    } catch (err) {
      alert("Invalid mnemonic");
    } finally {
      setUnlocking(false);
    }
  }

  async function handleCreateWallet() {
    setUnlocking(true);
    try {
      const { generateMnemonic, deriveAllKeys } = await import(
        "@/lib/crypto/keyDerivation"
      );
      const newMnemonic = generateMnemonic();
      const keys = await deriveAllKeys(newMnemonic);
      setKeys(keys);
      // Show mnemonic to user for backup
      alert(
        `IMPORTANT: Save your recovery phrase:\n\n${newMnemonic}\n\nThis will not be shown again.`
      );
    } catch (err) {
      alert("Failed to create wallet");
    } finally {
      setUnlocking(false);
    }
  }

  async function handleLogout() {
    clearKeys();
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Pay Wallet</h1>
        <div className="flex gap-2">
          {isUnlocked && (
            <Button variant="ghost" size="icon" onClick={clearKeys}>
              <Lock className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isUnlocked ? (
        <Card className="space-y-4">
          <div className="text-center">
            <Unlock className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Unlock your wallet to view balances and transact
            </p>
          </div>
          <Input
            placeholder="Enter your recovery phrase..."
            value={mnemonic}
            onChange={(e) => setMnemonic(e.target.value)}
            type="password"
          />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleUnlock} disabled={unlocking}>
              Unlock
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleCreateWallet}
              disabled={unlocking}
            >
              New Wallet
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <BalanceCard />
          <ActionButtons />
          <TokenList />
        </>
      )}
    </div>
  );
}
