"use client";

import { useState, useCallback, type ReactNode } from "react";
import { WalletContext } from "@/lib/hooks/useWallet";
import type { DerivedKeys } from "@/lib/crypto/keyDerivation";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [keys, setKeysState] = useState<DerivedKeys | null>(null);
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);

  const setKeys = useCallback(async (newKeys: DerivedKeys) => {
    setKeysState(newKeys);

    // Derive addresses client-side
    const { getEVMAddress } = await import("@/lib/wallet/evm");
    const { getSolanaAddress } = await import("@/lib/wallet/solana");

    setEvmAddress(getEVMAddress(newKeys.evmPrivateKey));
    setSolanaAddress(getSolanaAddress(newKeys.solanaKeypair.publicKey));
  }, []);

  const clearKeys = useCallback(() => {
    setKeysState(null);
    setEvmAddress(null);
    setSolanaAddress(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        keys,
        evmAddress,
        solanaAddress,
        setKeys,
        clearKeys,
        isUnlocked: keys !== null,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
