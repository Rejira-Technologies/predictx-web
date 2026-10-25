/**
 * hooks/use-ui-store.ts
 *
 * Global UI state store for singleton overlays and shared modal triggers.
 *
 * Currently manages:
 *  - walletConnectOpen: controls the single WalletConnectModal mounted in
 *    app/layout.tsx; any component that needs to open the wallet connect flow
 *    should call openWalletConnect() rather than mounting its own modal instance.
 */

import { create } from "zustand";

interface UIState {
  /** Whether the WalletConnectModal singleton (in app/layout.tsx) is open. */
  walletConnectOpen: boolean;
  /** Open the singleton WalletConnectModal. */
  openWalletConnect: () => void;
  /** Close the singleton WalletConnectModal. */
  closeWalletConnect: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  walletConnectOpen: false,
  openWalletConnect: () => set({ walletConnectOpen: true }),
  closeWalletConnect: () => set({ walletConnectOpen: false }),
}));
