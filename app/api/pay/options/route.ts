import { NextRequest, NextResponse } from "next/server";
import { getPaymentOptions } from "@/lib/walletconnect/gateway";

export async function POST(request: NextRequest) {
  const { paymentId } = await request.json();

  if (!paymentId) {
    return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
  }

  try {
    const options = await getPaymentOptions(paymentId);
    return NextResponse.json({ options });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get options";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
