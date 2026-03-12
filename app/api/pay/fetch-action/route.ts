import { NextRequest, NextResponse } from "next/server";
import { fetchAction } from "@/lib/walletconnect/gateway";

export async function POST(request: NextRequest) {
  const { paymentId, optionId, actionData } = await request.json();

  if (!paymentId || !optionId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const action = await fetchAction(paymentId, optionId, actionData);
    console.log("fetch-action response:", JSON.stringify(action));
    return NextResponse.json({ action });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch action";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
