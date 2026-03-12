import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { SOLANA_TOKEN_MINTS } from "./constants";
import bs58 from "bs58";

function getConnection(): Connection {
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    process.env.SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com";
  return new Connection(rpcUrl, "confirmed");
}

export async function getSolanaBalances(publicKey: PublicKey) {
  const connection = getConnection();

  const results = await Promise.all(
    Object.entries(SOLANA_TOKEN_MINTS).map(async ([symbol, token]) => {
      try {
        const mintPubkey = new PublicKey(token.mint);
        const ata = await getAssociatedTokenAddress(mintPubkey, publicKey);
        const account = await getAccount(connection, ata);
        return {
          symbol,
          balance: account.amount,
          decimals: token.decimals,
          chain: "solana" as const,
        };
      } catch {
        return {
          symbol,
          balance: 0n,
          decimals: token.decimals,
          chain: "solana" as const,
        };
      }
    })
  );

  return results;
}

export async function buildSolanaTransfer(
  senderPublicKey: PublicKey,
  recipientAddress: string,
  tokenSymbol: string,
  amount: bigint
): Promise<Transaction> {
  const connection = getConnection();
  const token = SOLANA_TOKEN_MINTS[tokenSymbol];
  if (!token) throw new Error(`Unsupported token: ${tokenSymbol}`);

  const mintPubkey = new PublicKey(token.mint);
  const recipientPubkey = new PublicKey(recipientAddress);

  const senderAta = await getAssociatedTokenAddress(mintPubkey, senderPublicKey);
  const recipientAta = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);

  const tx = new Transaction().add(
    createTransferInstruction(
      senderAta,
      recipientAta,
      senderPublicKey,
      amount
    )
  );

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = senderPublicKey;

  return tx;
}

export function signSolanaTransaction(
  transaction: Transaction,
  secretKey: Uint8Array
): Buffer {
  const keypair = Keypair.fromSecretKey(secretKey);
  transaction.sign(keypair);
  return transaction.serialize();
}

export function getSolanaAddress(publicKeyBytes: Uint8Array): string {
  return new PublicKey(publicKeyBytes).toBase58();
}
