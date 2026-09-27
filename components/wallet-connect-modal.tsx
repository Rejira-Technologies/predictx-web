"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { WalletError } from "@/hooks/use-wallet";
import type { StellarNetwork } from "@/lib/stellar";
import { AlertTriangle, CheckCircle, Globe, Loader2, Rocket } from "lucide-react";

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
}

// ── Network selector data ─────────────────────────────────────────────────

const NETWORKS: { value: StellarNetwork; label: string; description: string }[] = [
  {
    value: "testnet",
    label: "Testnet",
    description: "For development & testing — no real funds",
  },
  {
    value: "mainnet",
    label: "Mainnet",
    description: "Production network — real XLM",
  },
];

// ── Other wallet options (not integrated yet) ─────────────────────────────

const OTHER_WALLETS = [
  { name: "Albedo", icon: "⭐" },
  { name: "xBull", icon: "🐂" },
  { name: "Rabet", icon: "🪐" },
];

// ── Component ─────────────────────────────────────────────────────────────

export function WalletConnectModal({ open, onClose }: WalletConnectModalProps) {
  const { connect, isConnecting, network, switchNetwork } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    setError(null);
    setConnected(false);
    try {
      await connect();
      setConnected(true);
      // Brief success flash before closing
      setTimeout(() => {
        onClose();
        setConnected(false);
      }, 800);
    } catch (err) {
      if (err instanceof WalletError) {
        switch (err.code) {
          case "NOT_INSTALLED":
            setError(
              "Freighter is not installed. Install the extension at freighter.app, then try again."
            );
            break;
          case "USER_DENIED":
            setError("Connection request was denied. Please try again and approve in Freighter.");
            break;
          case "WRONG_NETWORK":
            setError(
              "Your Freighter wallet is on the wrong network. Please switch to the correct network in the extension."
            );
            break;
          default:
            setError(err.message || "An unexpected error occurred.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleClose = () => {
    setError(null);
    setConnected(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-surface border-2 border-primary/30 max-w-md clip-corner-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-primary text-glow-cyan uppercase tracking-wider">
            Connect Stellar Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* ── Network selector ──────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Select Network
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {NETWORKS.map((net) => (
                <button
                  key={net.value}
                  onClick={() => switchNetwork(net.value)}
                  className={[
                    "text-left p-3 rounded border-2 transition-all",
                    network === net.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  <div className="font-bold text-sm">{net.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{net.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Freighter (primary) ────────────────────────────────────── */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Connect with
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting || connected}
              variant="outline"
              className="w-full h-16 justify-start text-left border-2 border-border hover:border-primary bg-background-secondary hover:bg-surface transition-all group clip-corner-lg relative overflow-hidden"
            >
              {/* Scan animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              <span className="text-3xl mr-4">
                <Rocket className="h-7 w-7 text-primary" />
              </span>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">Freighter</span>
                  <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded">
                    POPULAR
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {isConnecting
                    ? "Connecting…"
                    : connected
                    ? "Connected!"
                    : "Stellar's official browser extension"}
                </span>
              </div>

              {isConnecting && (
                <Loader2 className="ml-2 h-5 w-5 animate-spin text-primary shrink-0" />
              )}
              {connected && !isConnecting && (
                <CheckCircle className="ml-2 h-5 w-5 text-success shrink-0" />
              )}
            </Button>
          </div>

          {/* ── Error banner ──────────────────────────────────────────── */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-accent/10 border border-accent/30 rounded text-sm text-accent">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Other wallets (coming soon) ───────────────────────────── */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Coming soon
            </div>
            <div className="grid grid-cols-3 gap-2">
              {OTHER_WALLETS.map((wallet) => (
                <button
                  key={wallet.name}
                  disabled
                  className="flex flex-col items-center gap-1 p-3 rounded border border-border/50 opacity-40 cursor-not-allowed"
                >
                  <span className="text-2xl">{wallet.icon}</span>
                  <span className="text-xs font-bold">{wallet.name}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Connect your Stellar wallet to stake on predictions and claim winnings
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
