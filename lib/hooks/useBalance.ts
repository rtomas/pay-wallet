"use client";

import useSWR from "swr";

interface Balance {
  chain: string;
  symbol: string;
  balance: string;
  raw: string;
}

interface BalanceResponse {
  balances: Balance[];
  total: string;
}

async function balanceFetcher(
  url: string,
  addresses: { evmAddress?: string; solanaAddress?: string }
): Promise<BalanceResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(addresses),
  });
  if (!res.ok) throw new Error("Failed to fetch balances");
  return res.json();
}

export function useBalance(evmAddress?: string, solanaAddress?: string) {
  const key =
    evmAddress || solanaAddress
      ? ["/api/wallet/balance", evmAddress, solanaAddress]
      : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([url, evm, sol]: [string, string | undefined, string | undefined]) =>
      balanceFetcher(url, { evmAddress: evm, solanaAddress: sol }),
    { refreshInterval: 30000 }
  );

  return {
    balances: data?.balances || [],
    total: data?.total || "0.00",
    isLoading,
    error,
    mutate,
  };
}
