"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/lib/hooks/useWallet";
import { parsePaymentLink } from "@/lib/walletconnect/parseLink";
import { Loader2 } from "lucide-react";

type Step = "input" | "options" | "confirm" | "done";

interface PaymentOption {
  chainId: string;
  tokenAddress: string;
  amount: string;
  recipient: string;
}

export function PayFlow() {
  const { keys } = useWallet();
  const [step, setStep] = useState<Step>("input");
  const [link, setLink] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [options, setOptions] = useState<PaymentOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!keys) {
    return (
      <Card>
        <p className="text-center text-[var(--muted-foreground)]">
          Unlock your wallet to use Pay.
        </p>
      </Card>
    );
  }

  async function handleParseLink() {
    setError(null);
    const parsed = parsePaymentLink(link);
    if (!parsed) {
      setError("Invalid payment link");
      return;
    }

    setPaymentId(parsed.paymentId);
    setLoading(true);

    try {
      const res = await fetch("/api/pay/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: parsed.paymentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOptions(data.options);
      setStep("options");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load options");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!selectedOption) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch action
      const actionRes = await fetch("/api/pay/fetch-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          chainId: selectedOption.chainId,
          tokenAddress: selectedOption.tokenAddress,
        }),
      });
      const actionData = await actionRes.json();
      if (!actionRes.ok) throw new Error(actionData.error);

      // Sign and send transaction
      const { signAndSerializeEVMTx } = await import("@/lib/wallet/evm");
      const chain = selectedOption.chainId.includes("8453") ? "base" : "ethereum";
      const signedTx = await signAndSerializeEVMTx(
        keys!.evmPrivateKey,
        chain,
        actionData.action.to as `0x${string}`,
        actionData.action.data as `0x${string}`
      );

      const sendRes = await fetch("/api/wallet/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chain, signedTx }),
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData.error);

      // Confirm payment
      await fetch("/api/pay/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, txHash: sendData.txHash }),
      });

      setTxHash(sendData.txHash);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-4">
      {step === "input" && (
        <>
          <div className="space-y-2">
            <label className="text-sm text-[var(--muted-foreground)]">
              Payment Link or ID
            </label>
            <Input
              placeholder="Paste WalletConnect Pay link..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleParseLink}
            disabled={!link || loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Continue"
            )}
          </Button>
        </>
      )}

      {step === "options" && (
        <>
          <p className="text-sm text-[var(--muted-foreground)]">
            Select payment option:
          </p>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <button
                key={i}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  selectedOption === opt
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
                }`}
                onClick={() => setSelectedOption(opt)}
              >
                <p className="font-medium">Chain: {opt.chainId}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Amount: {opt.amount}
                </p>
              </button>
            ))}
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleConfirm}
            disabled={!selectedOption || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm & Pay"
            )}
          </Button>
        </>
      )}

      {step === "done" && (
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-green-400">Payment Complete!</p>
          {txHash && (
            <p className="text-sm text-[var(--muted-foreground)]">
              TX: {txHash.slice(0, 20)}...
            </p>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              setStep("input");
              setLink("");
              setTxHash(null);
              setSelectedOption(null);
            }}
          >
            New Payment
          </Button>
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-[var(--destructive)]">{error}</p>
      )}
    </Card>
  );
}
