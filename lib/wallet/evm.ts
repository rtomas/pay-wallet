import {
  createPublicClient,
  http,
  type Address,
  type Hex,
  encodeFunctionData,
} from "viem";
import { mainnet, base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { TOKEN_ADDRESSES, ERC20_ABI } from "./constants";

function getClient(chain: "ethereum" | "base") {
  const rpcUrl =
    chain === "ethereum"
      ? process.env.NEXT_PUBLIC_ETH_RPC_URL || process.env.ETH_RPC_URL
      : process.env.NEXT_PUBLIC_BASE_RPC_URL || process.env.BASE_RPC_URL;

  return createPublicClient({
    chain: chain === "ethereum" ? mainnet : base,
    transport: http(rpcUrl),
  });
}

export async function getEVMBalances(
  address: Address,
  chain: "ethereum" | "base"
) {
  const client = getClient(chain);
  const tokens = TOKEN_ADDRESSES[chain];

  const results = await Promise.all(
    Object.entries(tokens).map(async ([symbol, token]) => {
      try {
        const balance = await client.readContract({
          address: token.address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address],
        });
        return { symbol, balance: balance as bigint, decimals: token.decimals, chain };
      } catch {
        return { symbol, balance: 0n, decimals: token.decimals, chain };
      }
    })
  );

  return results;
}

export function buildERC20Transfer(
  tokenAddress: Address,
  to: Address,
  amount: bigint
): Hex {
  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [to, amount],
  });
}

export async function signAndSerializeEVMTx(
  privateKey: Uint8Array,
  chain: "ethereum" | "base",
  to: Address,
  data: Hex
): Promise<Hex> {
  const account = privateKeyToAccount(
    `0x${Buffer.from(privateKey).toString("hex")}` as Hex
  );

  const client = getClient(chain);
  const chainObj = chain === "ethereum" ? mainnet : base;

  const [nonce, gasPrice] = await Promise.all([
    client.getTransactionCount({ address: account.address }),
    client.getGasPrice(),
  ]);

  const gas = await client.estimateGas({
    account: account.address,
    to,
    data,
  });

  const tx = {
    to,
    data,
    nonce,
    gas,
    gasPrice,
    chainId: chainObj.id,
  };

  const serialized = await account.signTransaction(tx);
  return serialized;
}

export async function signTypedData(
  privateKey: Uint8Array,
  typedData: Record<string, unknown>
): Promise<Hex> {
  const account = privateKeyToAccount(
    `0x${Buffer.from(privateKey).toString("hex")}` as Hex
  );

  return account.signTypedData(typedData as any);
}

export function getEVMAddress(privateKey: Uint8Array): Address {
  const account = privateKeyToAccount(
    `0x${Buffer.from(privateKey).toString("hex")}` as Hex
  );
  return account.address;
}
