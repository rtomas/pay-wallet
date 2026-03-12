"use client";

import { Card } from "@/components/ui/card";
import { useBalance } from "@/lib/hooks/useBalance";
import { useWallet } from "@/lib/hooks/useWallet";

export function BalanceCard() {
  const { evmAddress, solanaAddress } = useWallet();
  const { total, isLoading } = useBalance(
    evmAddress || undefined,
    solanaAddress || undefined
  );

  return (
    <Card className="text-center">
      <p className="text-sm text-[var(--muted-foreground)]">Total Balance</p>
      <p className="mt-2 text-4xl font-bold tracking-tight">
        {isLoading ? (
          <span className="animate-pulse">...</span>
        ) : (
          `$${total}`
        )}
      </p>
    </Card>
  );
}
