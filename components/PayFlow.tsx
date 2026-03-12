"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/lib/hooks/useWallet";
import { parsePaymentLink } from "@/lib/walletconnect/parseLink";
import { QRScanner } from "@/components/QRScanner";
import { Loader2 } from "lucide-react";

type Step = "scan" | "options" | "confirm" | "done";

interface PaymentOption {
  chainId: string;
  tokenAddress: string;
  amount: string;
  recipient: string;
}

export function PayFlow() {
  const { keys } = useWallet();
  const [step, setStep] = useState<Step>("scan");
  const [paymentId, setPaymentId] = useState("");
  const [options, setOptions] = useState<PaymentOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleScan = useCallback(async (data: string) => {
    setError(null);
    const parsed = parsePaymentLink(data);
    if (!parsed) {
      setError("Invalid payment QR code");
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
      const respData = await res.json();
      if (!res.ok) throw new Error(respData.error);
      setOptions(respData.options);
      setStep("options");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load options");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleScanError = useCallback((err: string) => {
    setError(err);
  }, []);

  if (!keys) {
    return (
      <Card>
        <p className="text-center text-[var(--muted-foreground)]">
          Unlock your wallet to use Pay.
        </p>
      </Card>
    );
  }

  async function handleConfirm() {
    if (!selectedOption) return;
    setLoading(true);
    setError(null);

    try {
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
      {step === "scan" && (
        <>
          <p className="text-sm text-[var(--muted-foreground)] text-center">
            Scan a WalletConnect Pay QR code
          </p>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : (
            <QRScanner onScan={handleScan} onError={handleScanError} />
          )}
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
              setStep("scan");
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
