"use client";

import { useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/lib/hooks/useWallet";
import { parsePaymentLink } from "@/lib/walletconnect/parseLink";
import { QRScanner } from "@/components/QRScanner";
import { Loader2 } from "lucide-react";

type Step = "scan" | "collect" | "signing" | "done";

interface CollectField {
  type: string;
  id: string;
  name: string;
  required: boolean;
}

function decodeHexAction(hex: string) {
  const json = Buffer.from(hex, "hex").toString("utf8");
  return JSON.parse(json);
}

export function PayFlow() {
  const { keys, evmAddress } = useWallet();
  const [step, setStep] = useState<Step>("scan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // Collect data state
  const [collectFields, setCollectFields] = useState<CollectField[]>([]);
  const [collectValues, setCollectValues] = useState<Record<string, string>>({});
  const pendingPayRef = useRef<{
    paymentId: string;
    optionId: string;
    actions: any[];
    collectData: any;
  } | null>(null);

  const handleScan = useCallback(
    async (data: string) => {
      setError(null);
      const parsed = parsePaymentLink(data);
      if (!parsed) {
        setError(`Invalid QR code: ${data}`);
        return;
      }

      const paymentId = parsed.paymentId;
      setLoading(true);
      setStep("signing");

      try {
        const accounts: string[] = [];
        if (evmAddress) {
          accounts.push(
            `eip155:1:${evmAddress}`,
            `eip155:8453:${evmAddress}`,
            `eip155:10:${evmAddress}`,
            `eip155:137:${evmAddress}`,
            `eip155:42161:${evmAddress}`
          );
        }

        const optionsRes = await fetch("/api/pay/options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, accounts }),
        });
        const optionsText = await optionsRes.text();
        let optionsData: any;
        try {
          optionsData = JSON.parse(optionsText);
        } catch {
          throw new Error(`Invalid response: ${optionsText.slice(0, 200)}`);
        }
        if (!optionsRes.ok) throw new Error(optionsData.error || optionsText.slice(0, 200));

        const option = optionsData.options?.[0];
        if (!option) throw new Error("No payment options available");

        // Decode actions from hex
        const resolvedActions = option.actions.map((action: any) => {
          if (action.type === "build" && action.data?.data) {
            return decodeHexAction(action.data.data);
          }
          if (action.type === "walletRpc" && action.data) {
            return typeof action.data === "string"
              ? decodeHexAction(action.data)
              : action.data;
          }
          return action;
        });

        // Check if collectData is required
        if (option.collectData?.fields?.length) {
          pendingPayRef.current = {
            paymentId,
            optionId: option.id,
            actions: resolvedActions,
            collectData: option.collectData,
          };
          setCollectFields(option.collectData.fields);
          setCollectValues({});
          setStep("collect");
          setLoading(false);
          return;
        }

        await signAndConfirm(paymentId, option.id, resolvedActions, null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Payment failed");
        setStep("scan");
        setLoading(false);
      }
    },
    [evmAddress, keys]
  );

  async function signAndConfirm(
    paymentId: string,
    optionId: string,
    actions: any[],
    collectedData: Record<string, any> | null
  ) {
    setStep("signing");
    setLoading(true);
    setError(null);

    try {
      const { signTypedData } = await import("@/lib/wallet/evm");
      const results: Array<{ type: "walletRpc"; data: string[] }> = [];

      for (const action of actions) {
        const paramsRaw = action.params;
        if (!paramsRaw) {
          throw new Error("Action missing params");
        }
        const params = typeof paramsRaw === "string" ? JSON.parse(paramsRaw) : paramsRaw;
        const typedData = typeof params[1] === "string" ? JSON.parse(params[1]) : params[1];
        const signature = await signTypedData(keys!.evmPrivateKey, typedData);
        results.push({ type: "walletRpc", data: [signature] });
      }

      const confirmRes = await fetch("/api/pay/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          optionId,
          results,
          collectedData,
        }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error);

      let current = confirmData;
      while (!current.isFinal) {
        await new Promise((r) => setTimeout(r, current.pollInMs || 2000));
        const pollRes = await fetch("/api/pay/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, optionId, results, collectedData }),
        });
        current = await pollRes.json();
        if (!pollRes.ok) throw new Error(current.error);
      }

      setStatus(current.status);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setStep("scan");
    } finally {
      setLoading(false);
    }
  }

  async function handleCollectSubmit() {
    if (!pendingPayRef.current) return;
    const { paymentId, optionId, actions, collectData } = pendingPayRef.current;

    // Add value to each field + append tosConfirmed field
    const fields = collectData.fields.map((f: any) => ({
      ...f,
      value: collectValues[f.id] || "",
    }));
    fields.push({
      type: "boolean",
      id: "tosConfirmed",
      name: "Terms of Service",
      required: true,
      value: "true",
    });

    const collectedData = {
      ...collectData,
      fields,
    };
    await signAndConfirm(paymentId, optionId, actions, collectedData);
  }

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

  function reset() {
    setStep("scan");
    setStatus(null);
    setError(null);
    setCollectFields([]);
    setCollectValues({});
    pendingPayRef.current = null;
  }

  return (
    <Card className="space-y-4">
      {step === "scan" && !loading && (
        <>
          <p className="text-sm text-[var(--muted-foreground)] text-center">
            Scan a WalletConnect Pay QR code
          </p>
          <QRScanner onScan={handleScan} onError={handleScanError} />
        </>
      )}

      {step === "collect" && (
        <>
          <p className="text-sm font-medium">Verification required</p>
          <div className="space-y-3">
            {collectFields.map((field) => (
              <div key={field.id}>
                <label className="text-xs text-[var(--muted-foreground)]">
                  {field.name} {field.required && "*"}
                </label>
                <Input
                  type={field.type === "date" ? "date" : "text"}
                  value={collectValues[field.id] || ""}
                  onChange={(e) =>
                    setCollectValues((v) => ({ ...v, [field.id]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <Button className="w-full" size="lg" onClick={handleCollectSubmit}>
            Continue
          </Button>
        </>
      )}

      {step === "signing" && (
        <div className="flex flex-col items-center py-8 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">
            Processing payment...
          </p>
        </div>
      )}

      {step === "done" && (
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-green-400">
            {status === "succeeded" ? "Payment Complete!" : `Payment ${status}`}
          </p>
          <Button variant="secondary" onClick={reset}>
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
