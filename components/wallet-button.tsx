"use client";

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
import { useWallet } from "@/hooks/use-wallet";
import { useUIStore } from "@/hooks/use-ui-store";
import type { StellarNetwork } from "@/hooks/use-wallet";
import { shortenAddress } from "@/lib/utils";
import { formatXLM } from "@/lib/calculations";
import { resetAllData } from "@/lib/mock-data";
import Link from "next/link";
import { toast } from "sonner";

const NETWORK_CONFIG: Record<StellarNetwork, { label: string; color: string }> = {
  testnet: { label: "Testnet", color: "text-yellow-400" },
  mainnet: { label: "Mainnet", color: "text-green-400" },
};

export function WalletButton() {
  const { isConnected, address, balance, disconnect, network, switchNetwork } = useWallet();
  const openWalletConnect = useUIStore((s) => s.openWalletConnect);

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

  if (!isConnected)
    return (
      <Button onClick={() => openWalletConnect()}>
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );

  const currentNet = NETWORK_CONFIG[network];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <span>{shortenAddress(address)}</span>
              <span className={`text-[10px] font-semibold uppercase ${currentNet.color}`}>
                {currentNet.label}
              </span>
            </div>

            <span className="text-xs text-primary">
              {formatXLM(balance)}
            </span>
          </div>

          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={copy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Address
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Network switcher */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            <span>Network</span>
            <span className={`ml-auto text-xs font-semibold ${currentNet.color}`}>
              {currentNet.label}
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
