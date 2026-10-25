"use client";

/**
 * components/wallet-connect-modal-root.tsx
 *
 * Singleton wrapper that renders exactly ONE WalletConnectModal in the
 * component tree (mounted in app/layout.tsx).
 *
 * Any component that needs to open the wallet-connect flow should call
 *   useUIStore.getState().openWalletConnect()
 * instead of mounting its own WalletConnectModal instance.
 */

import { WalletConnectModal } from "@/components/wallet-connect-modal";
import { useUIStore } from "@/hooks/use-ui-store";

export function WalletConnectModalRoot() {
  const walletConnectOpen = useUIStore((s) => s.walletConnectOpen);
  const closeWalletConnect = useUIStore((s) => s.closeWalletConnect);

  return (
    <WalletConnectModal
      open={walletConnectOpen}
      onClose={closeWalletConnect}
    />
  );
}
