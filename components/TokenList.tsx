"use client";

import { Card } from "@/components/ui/card";
import { useBalance } from "@/lib/hooks/useBalance";
import { useWallet } from "@/lib/hooks/useWallet";

const chainLabels: Record<string, string> = {
  ethereum: "Ethereum",
  base: "Base",
  solana: "Solana",
};

export function TokenList() {
  const { evmAddress, solanaAddress } = useWallet();
  const { balances, isLoading } = useBalance(
    evmAddress || undefined,
    solanaAddress || undefined
  );

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-[var(--secondary)]" />
          ))}
        </div>
      </Card>
    );
  }

  const nonZero = balances.filter((b) => parseFloat(b.balance) > 0);

  if (nonZero.length === 0) {
    return (
      <Card>
        <p className="text-center text-sm text-[var(--muted-foreground)]">
          No stablecoins in the wallet
        </p>
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-[var(--border)] p-0">
      {nonZero.map((b) => (
        <div
          key={`${b.chain}-${b.symbol}`}
          className="flex items-center justify-between px-6 py-4"
        >
          <div>
            <p className="font-medium">{b.symbol}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {chainLabels[b.chain] || b.chain}
            </p>
          </div>
          <p className="font-mono text-sm">${b.balance}</p>
        </div>
      ))}
    </Card>
  );
}
