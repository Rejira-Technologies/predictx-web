"use client";

import { useState } from "react";
import { Wallet, ChevronDown, LogOut, Copy, Globe, ArrowRightLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { WalletConnectModal } from "./wallet-connect-modal";
import { useWallet } from "@/hooks/use-wallet";
import type { StellarNetwork } from "@/lib/stellar";
import { shortenAddress } from "@/lib/utils";
import { formatXLM } from "@/lib/calculations";
import { resetAllData } from "@/lib/mock-data";
import Link from "next/link";
import { toast } from "sonner";

// ── Network display config ────────────────────────────────────────────────

const NETWORK_CONFIG: Record<StellarNetwork, { label: string; color: string }> = {
  testnet: { label: "Testnet", color: "text-yellow-400" },
  mainnet: { label: "Mainnet", color: "text-green-400" },
};

// ── Component ─────────────────────────────────────────────────────────────

export function WalletButton() {
  const [showConnectModal, setShowConnectModal] = useState(false);

  const {
    isConnected,
    address,
    balance,
    disconnect,
    network,
    switchNetwork,
    networkMismatch,
    refreshBalance,
  } = useWallet();

  const copy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard not available in this context");
      return;
    }
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied!");
    } catch {
      toast.error("Failed to copy address");
    }
  };

  // ── Not connected ─────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <>
        <Button onClick={() => setShowConnectModal(true)}>
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>

        <WalletConnectModal
          open={showConnectModal}
          onClose={() => setShowConnectModal(false)}
        />
      </>
    );
  }

  const currentNet = NETWORK_CONFIG[network];

  // ── Connected ─────────────────────────────────────────────────────────
  return (
    <>
      {/* Network mismatch warning banner (renders outside the dropdown) */}
      {networkMismatch && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded text-amber-400 text-xs font-semibold animate-pulse">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Wrong network — switch Freighter to {NETWORK_CONFIG[network].label}
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={networkMismatch ? "border-amber-500/40" : undefined}
          >
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <span>{shortenAddress(address)}</span>
                <span
                  className={`text-[10px] font-semibold uppercase ${currentNet.color}`}
                >
                  {currentNet.label}
                </span>
                {networkMismatch && (
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                )}
              </div>

              <span className="text-xs text-primary">
                {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM
              </span>
            </div>

            <span className="text-xs text-primary">
              {formatXLM(balance)}
            </span>
          </div>

          <DropdownMenuItem onClick={copy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Address
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={async () => {
              await refreshBalance();
              toast.success("Balance refreshed");
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Balance
            <span className="ml-auto text-xs text-muted-foreground font-mono">
              {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {(Object.keys(NETWORK_CONFIG) as StellarNetwork[]).map((net) => (
              <DropdownMenuItem
                key={net}
                onClick={() => switchNetwork(net)}
                className={network === net ? "bg-accent" : ""}
              >
                <Globe className={`mr-2 h-4 w-4 ${NETWORK_CONFIG[net].color}`} />
                {NETWORK_CONFIG[net].label}
                {network === net && (
                  <span className="ml-auto text-xs text-muted-foreground">●</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/dashboard?tab=completed">Transaction History</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              window.confirm("Reset all demo data (polls, stakes, votes, and wallet) to initial state?")
            ) {
              resetAllData();
              window.location.reload();
            }
          }}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset Demo Data
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={disconnect}>
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
