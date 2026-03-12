"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowDownLeft, ArrowUpRight, CreditCard } from "lucide-react";

export function ActionButtons() {
  return (
    <div className="flex gap-3">
      <Link href="/receive" className="flex-1">
        <Button variant="secondary" className="w-full gap-2" size="lg">
          <ArrowDownLeft className="h-4 w-4" />
          Receive
        </Button>
      </Link>
      <Link href="/send" className="flex-1">
        <Button variant="secondary" className="w-full gap-2" size="lg">
          <ArrowUpRight className="h-4 w-4" />
          Send
        </Button>
      </Link>
      <Link href="/pay" className="flex-1">
        <Button className="w-full gap-2" size="lg">
          <CreditCard className="h-4 w-4" />
          Pay
        </Button>
      </Link>
    </div>
  );
}
