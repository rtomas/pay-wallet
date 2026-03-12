import { type Address } from "viem";
import { mainnet, base } from "viem/chains";

export const SUPPORTED_CHAINS = {
  ethereum: mainnet,
  base: base,
  solana: { id: "solana", name: "Solana" },
} as const;

export const TOKEN_ADDRESSES: Record<
  string,
  Record<string, { address: Address; decimals: number; symbol: string }>
> = {
  ethereum: {
    USDC: {
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
      decimals: 6,
      symbol: "USDC",
    },
    USDT: {
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as Address,
      decimals: 6,
      symbol: "USDT",
    },
  },
  base: {
    USDC: {
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address,
      decimals: 6,
      symbol: "USDC",
    },
    USDT: {
      address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2" as Address,
      decimals: 6,
      symbol: "USDT",
    },
  },
};

export const SOLANA_TOKEN_MINTS: Record<string, { mint: string; decimals: number; symbol: string }> = {
  USDC: {
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    symbol: "USDC",
  },
  USDT: {
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    symbol: "USDT",
  },
};

export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

export function formatTokenAmount(amount: bigint, decimals: number): string {
  const str = amount.toString().padStart(decimals + 1, "0");
  const intPart = str.slice(0, str.length - decimals) || "0";
  const decPart = str.slice(str.length - decimals, str.length - decimals + 2);
  return `${intPart}.${decPart}`;
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  const [intPart, decPart = ""] = amount.split(".");
  const paddedDec = decPart.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(intPart + paddedDec);
}
