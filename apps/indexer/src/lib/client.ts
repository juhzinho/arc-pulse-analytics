import { createPublicClient, http } from "viem";
import { defineChain } from "viem";
import { config } from "../config";

export const arcChain = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "Arc",
    symbol: "ARC",
    decimals: 18
  },
  rpcUrls: {
    default: { http: [config.ARC_RPC_URL] }
  }
});

export const client = createPublicClient({
  chain: arcChain,
  transport: http(config.ARC_RPC_URL, { retryCount: 3 })
});
