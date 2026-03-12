"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/lib/hooks/useWallet";
import { Loader2 } from "lucide-react";

type Chain = "ethereum" | "base" | "solana";
type Token = "USDC" | "USDT";

export function SendForm() {
  const { keys, evmAddress, solanaAddress } = useWallet();
  const [chain, setChain] = useState<Chain>("base");
  const [token, setToken] = useState<Token>("USDC");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!keys) {
    return (
      <Card>
        <p className="text-center text-[var(--muted-foreground)]">
          Unlock your wallet to send tokens.
        </p>
      </Card>
    );
  }

  async function handleSend() {
    if (!keys || !recipient || !amount) return;
    setSending(true);
    setError(null);
    setTxHash(null);

    try {
      let signedTx: string;

      if (chain === "solana") {
        const { buildSolanaTransfer, signSolanaTransaction } = await import(
          "@/lib/wallet/solana"
        );
        const { PublicKey } = await import("@solana/web3.js");
        const { parseTokenAmount } = await import("@/lib/wallet/constants");

        const tx = await buildSolanaTransfer(
          new PublicKey(keys.solanaKeypair.publicKey),
          recipient,
          token,
          parseTokenAmount(amount, 6)
        );

        const serialized = signSolanaTransaction(tx, keys.solanaKeypair.secretKey);
        signedTx = Buffer.from(serialized).toString("base64");
      } else {
        const { buildERC20Transfer, signAndSerializeEVMTx } = await import(
          "@/lib/wallet/evm"
        );
        const { TOKEN_ADDRESSES, parseTokenAmount } = await import(
          "@/lib/wallet/constants"
        );

        const tokenInfo = TOKEN_ADDRESSES[chain][token];
        const data = buildERC20Transfer(
          tokenInfo.address,
          recipient as `0x${string}`,
          parseTokenAmount(amount, tokenInfo.decimals)
        );

        signedTx = await signAndSerializeEVMTx(
          keys.evmPrivateKey,
          chain,
          tokenInfo.address,
          data
        );
      }

      const res = await fetch("/api/wallet/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chain, signedTx }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTxHash(data.txHash);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-[var(--muted-foreground)]">Chain</label>
        <div className="flex gap-2">
          {(["ethereum", "base", "solana"] as Chain[]).map((c) => (
            <Button
              key={c}
              variant={chain === c ? "default" : "secondary"}
              size="sm"
              onClick={() => setChain(c)}
            >
              {c === "ethereum" ? "Ethereum" : c === "base" ? "Base" : "Solana"}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-[var(--muted-foreground)]">Token</label>
        <div className="flex gap-2">
          {(["USDC", "USDT"] as Token[]).map((t) => (
            <Button
              key={t}
              variant={token === t ? "default" : "secondary"}
              size="sm"
              onClick={() => setToken(t)}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-[var(--muted-foreground)]">Recipient</label>
        <Input
          placeholder={chain === "solana" ? "Solana address" : "0x..."}
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-[var(--muted-foreground)]">Amount</label>
        <Input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          min="0"
        />
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={handleSend}
        disabled={sending || !recipient || !amount}
      >
        {sending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send"
        )}
      </Button>

      {txHash && (
        <p className="text-center text-sm text-green-400">
          Sent! TX: {txHash.slice(0, 16)}...
        </p>
      )}

      {error && (
        <p className="text-center text-sm text-[var(--destructive)]">{error}</p>
      )}
    </Card>
  );
}
