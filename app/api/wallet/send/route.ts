import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, type Hex } from "viem";
import { mainnet, base } from "viem/chains";
import { Connection } from "@solana/web3.js";

export async function POST(request: NextRequest) {
  const { chain, signedTx } = await request.json();

  if (!chain || !signedTx) {
    return NextResponse.json({ error: "Missing chain or signedTx" }, { status: 400 });
  }

  try {
    if (chain === "solana") {
      const connection = new Connection(
        process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
        "confirmed"
      );
      const txBuffer = Buffer.from(signedTx, "base64");
      const signature = await connection.sendRawTransaction(txBuffer);
      await connection.confirmTransaction(signature, "confirmed");
      return NextResponse.json({ txHash: signature });
    }

    // EVM chains
    const chainConfig = chain === "base" ? base : mainnet;
    const rpcUrl =
      chain === "base" ? process.env.BASE_RPC_URL : process.env.ETH_RPC_URL;

    const client = createPublicClient({
      chain: chainConfig,
      transport: http(rpcUrl),
    });

    const txHash = await client.sendRawTransaction({
      serializedTransaction: signedTx as Hex,
    });

    return NextResponse.json({ txHash });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transaction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
