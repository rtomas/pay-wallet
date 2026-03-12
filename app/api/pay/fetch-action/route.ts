import { NextRequest, NextResponse } from "next/server";
import { fetchPaymentAction } from "@/lib/walletconnect/gateway";

export async function POST(request: NextRequest) {
  const { paymentId, chainId, tokenAddress } = await request.json();

  if (!paymentId || !chainId || !tokenAddress) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const action = await fetchPaymentAction(paymentId, { chainId, tokenAddress });
    return NextResponse.json({ action });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch action";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
