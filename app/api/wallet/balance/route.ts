import { NextRequest, NextResponse } from "next/server";
import { getEVMBalances } from "@/lib/wallet/evm";
import { getSolanaBalances } from "@/lib/wallet/solana";
import { PublicKey } from "@solana/web3.js";
import { type Address } from "viem";
import { formatTokenAmount } from "@/lib/wallet/constants";

export async function POST(request: NextRequest) {
  const { evmAddress, solanaAddress } = await request.json();

  if (!evmAddress && !solanaAddress) {
    return NextResponse.json({ error: "No addresses provided" }, { status: 400 });
  }

  const balances: Array<{
    chain: string;
    symbol: string;
    balance: string;
    raw: string;
  }> = [];

  const fetches: Promise<void>[] = [];

  if (evmAddress) {
    for (const chain of ["ethereum", "base"] as const) {
      fetches.push(
        getEVMBalances(evmAddress as Address, chain).then((results) => {
          for (const r of results) {
            balances.push({
              chain: r.chain,
              symbol: r.symbol,
              balance: formatTokenAmount(r.balance, r.decimals),
              raw: r.balance.toString(),
            });
          }
        })
      );
    }
  }

  if (solanaAddress) {
    fetches.push(
      getSolanaBalances(new PublicKey(solanaAddress)).then((results) => {
        for (const r of results) {
          balances.push({
            chain: r.chain,
            symbol: r.symbol,
            balance: formatTokenAmount(BigInt(r.balance.toString()), r.decimals),
            raw: r.balance.toString(),
          });
        }
      })
    );
  }

  await Promise.all(fetches);

  const total = balances.reduce(
    (sum, b) => sum + parseFloat(b.balance),
    0
  );

  return NextResponse.json({ balances, total: total.toFixed(2) });
}
