"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { DerivedKeys } from "@/lib/crypto/keyDerivation";

interface WalletContextType {
  keys: DerivedKeys | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  setKeys: (keys: DerivedKeys) => void;
  clearKeys: () => void;
  isUnlocked: boolean;
}

const WalletContext = createContext<WalletContextType>({
  keys: null,
  evmAddress: null,
  solanaAddress: null,
  setKeys: () => {},
  clearKeys: () => {},
  isUnlocked: false,
});

export function useWallet() {
  return useContext(WalletContext);
}

export { WalletContext };

// Provider is defined in components/WalletProvider.tsx
