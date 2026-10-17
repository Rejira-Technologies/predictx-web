/**
 * Stellar SDK helpers and client interaction layer (#20, #332)
 */

import * as StellarSdk from "@stellar/stellar-sdk";

export const HORIZON_URLS = {
  testnet: "https://horizon-testnet.stellar.org",
  mainnet: "https://horizon.stellar.org",
} as const;

export const SOROBAN_RPC_URLS = {
  testnet: "https://soroban-testnet.stellar.org",
  mainnet: "https://soroban-rpc.mainnet.stellar.org",
} as const;

export type StellarNetwork = keyof typeof HORIZON_URLS;

export const NETWORK = {
  testnet: {
    networkPassphrase: StellarSdk.Networks.TESTNET,
    sorobanRpcUrl:
      process.env.NEXT_PUBLIC_STELLAR_RPC_URL || SOROBAN_RPC_URLS.testnet,
    horizonUrl:
      process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || HORIZON_URLS.testnet,
  },
  mainnet: {
    networkPassphrase: StellarSdk.Networks.PUBLIC,
    sorobanRpcUrl:
      process.env.NEXT_PUBLIC_STELLAR_RPC_URL || SOROBAN_RPC_URLS.mainnet,
    horizonUrl:
      process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || HORIZON_URLS.mainnet,
  },
};

// Active network driven by NEXT_PUBLIC_STELLAR_NETWORK
const activeNetwork =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
    ? NETWORK.mainnet
    : NETWORK.testnet;

export const sorobanServer = new StellarSdk.rpc.Server(
  activeNetwork.sorobanRpcUrl,
);

export const horizonServer = new StellarSdk.Horizon.Server(
  activeNetwork.horizonUrl,
);

export const networkPassphrase = activeNetwork.networkPassphrase;

export type StellarErrorCode =
  | "WALLET_NOT_FOUND"
  | "USER_REJECTED"
  | "INSUFFICIENT_BALANCE"
  | "TX_FAILED"
  | "NETWORK_ERROR";

export class StellarError extends Error {
  constructor(
    message: string,
    public code: StellarErrorCode,
    public details?: unknown,
  ) {
    super(message);
    this.name = "StellarError";
  }
}

export interface StellarClient {
  getHorizonUrl: (network?: StellarNetwork) => string;
  getAccountBalance: (publicKey: string, network?: StellarNetwork) => Promise<number>;
  getAccountSequence: (publicKey: string, network?: StellarNetwork) => Promise<string>;
  signAndSubmitTransaction: (txXdr: string) => Promise<never>;
}

export const stellar: StellarClient = {
  getHorizonUrl(network: StellarNetwork = "testnet"): string {
    return HORIZON_URLS[network];
  },

  async getAccountBalance(publicKey: string, network: StellarNetwork = "testnet"): Promise<number> {
    try {
      const response = await fetch(
        `${HORIZON_URLS[network]}/accounts/${publicKey}`
      );
      if (!response.ok) return 0;
      const data = await response.json();
      const native = data.balances?.find(
        (b: { asset_type: string; balance?: string }) => b.asset_type === "native"
      )?.balance;
      return parseFloat(native ?? "0");
    } catch {
      return 0;
    }
  },

  async getAccountSequence(publicKey: string, network: StellarNetwork = "testnet"): Promise<string> {
    const response = await fetch(
      `${HORIZON_URLS[network]}/accounts/${publicKey}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch account sequence for ${publicKey}`);
    }
    const data = await response.json();
    return data.sequence ?? "0";
  },

  async signAndSubmitTransaction(_txXdr: string): Promise<never> {
    throw new Error("signAndSubmitTransaction is not implemented yet");
  },
};
