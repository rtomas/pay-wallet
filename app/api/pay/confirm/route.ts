import { NextRequest, NextResponse } from "next/server";
import { confirmPayment } from "@/lib/walletconnect/gateway";

export async function POST(request: NextRequest) {
  const { paymentId, txHash } = await request.json();

  if (!paymentId || !txHash) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const result = await confirmPayment(paymentId, txHash);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to confirm";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
