/**
 * Stellar SDK helpers and client interaction layer.
 *
 * Only the Horizon URL helper is used by the rest of the codebase
 * (hooks/use-wallet.tsx). The three additional members that were here
 * (getAccountBalance, getAccountSequence, signAndSubmitTransaction) had no
 * call sites and have been removed to keep this module honest.
 *
 * When proper Soroban / smart-contract integration is added, extend this
 * module at that point rather than leaving stub implementations.
 */

export const HORIZON_URLS = {
  testnet: "https://horizon-testnet.stellar.org",
  mainnet: "https://horizon.stellar.org",
} as const;

export type StellarNetwork = keyof typeof HORIZON_URLS;

/**
 * Returns the Horizon REST endpoint for the requested network.
 *
 * @example
 *   const url = getHorizonUrl("testnet");
 *   // "https://horizon-testnet.stellar.org"
 */
export function getHorizonUrl(network: StellarNetwork = "testnet"): string {
  return HORIZON_URLS[network];
}
