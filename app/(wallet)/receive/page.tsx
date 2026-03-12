"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCode } from "@/components/QRCode";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useWallet } from "@/lib/hooks/useWallet";
import { ArrowLeft, Copy, Check } from "lucide-react";
import Link from "next/link";

export default function ReceivePage() {
  const { evmAddress, solanaAddress, isUnlocked } = useWallet();
  const [tab, setTab] = useState("evm");
  const [copied, setCopied] = useState(false);

  if (!isUnlocked) {
    return (
      <div className="space-y-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
        <Card>
          <p className="text-center text-[var(--muted-foreground)]">
            Unlock your wallet first.
          </p>
        </Card>
      </div>
    );
  }

  const address = tab === "solana" ? solanaAddress : evmAddress;

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <Link href="/">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </Link>

      <h2 className="text-lg font-bold">Receive</h2>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="evm" className="flex-1">Ethereum / Base</TabsTrigger>
          <TabsTrigger value="solana" className="flex-1">Solana</TabsTrigger>
        </TabsList>

        {["evm", "solana"].map((chain) => (
          <TabsContent key={chain} value={chain}>
            <Card className="flex flex-col items-center space-y-4">
              {address && <QRCode value={address} size={200} />}
              <div className="w-full">
                <p className="text-xs text-[var(--muted-foreground)] text-center mb-1">
                  {chain === "solana" ? "Solana" : "Ethereum / Base"} Address
                </p>
                <p className="break-all rounded-lg bg-[var(--secondary)] p-3 text-xs font-mono text-center">
                  {address}
                </p>
              </div>
              <Button variant="secondary" className="w-full gap-2" onClick={copyAddress}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Address"}
              </Button>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
