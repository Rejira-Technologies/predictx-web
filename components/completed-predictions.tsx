"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  Trophy,
  Coins,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "./shared/empty-state";
import { GamingButton } from "./shared/gaming-button";
import { GlowCard } from "./shared/glow-card";
import { GamingTabs } from "./shared/gaming-tabs";
import { useStaking } from "@/hooks/use-staking";
import { calculateCompletedPayout } from "@/lib/calculations";
import { XLM_USD_RATE } from "@/lib/constants";
import type { Stake } from "@/lib/mock-data";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) return "Recently";

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 1) return "1 day ago";
  if (diffDays > 1) return `${diffDays} days ago`;
  if (diffHours === 1) return "1 hour ago";
  if (diffHours > 1) return `${diffHours} hours ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return "Just now";
}

function truncateTxHash(hash?: string): string {
  if (!hash) return "";
  const clean = hash.startsWith("0x") ? hash.slice(2) : hash;
  if (clean.length <= 10) return clean;
  return `${clean.slice(0, 4)}...${clean.slice(-4)}`;
}

type FilterOption = "all" | "won" | "lost";
type SortOption = "latest" | "highest_win" | "biggest_loss";

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "latest", label: "Latest" },
  { key: "highest_win", label: "Highest Win" },
  { key: "biggest_loss", label: "Biggest Loss" },
];

// ── Confirmation dialog ────────────────────────────────────────────────────────

function ClaimConfirmDialog({
  stake,
  onConfirm,
  onCancel,
  confirming,
}: {
  stake: Stake;
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
}) {
  const grossPayout =
    stake.grossPayout ??
    (stake.profit != null ? stake.amount + stake.profit / 0.95 : stake.amount);
  const payout = calculateCompletedPayout(stake.amount, grossPayout);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    >
      <GlowCard variant="gold" className="w-full max-w-md">
        <div className="p-2 space-y-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-gold" />
            <h3 className="font-display text-xl font-black text-gold uppercase tracking-wider">
              Claim Winnings
            </h3>
          </div>
          <p className="text-muted-foreground text-sm">
            You are about to claim your winnings from:
          </p>
          <div className="bg-background/50 rounded p-3 border border-gold/20 space-y-1 text-sm">
            <p className="font-bold text-foreground">{stake.question}</p>
            <p className="text-muted-foreground">{stake.matchName}</p>
          </div>
          {/* Fee breakdown */}
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between text-muted-foreground">
              <span>Gross share</span>
              <span>${grossPayout.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-accent">
              <span>Platform fee (5%)</span>
              <span>− ${payout.fee.toFixed(2)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-gold font-bold">
              <span>Net payout</span>
              <span>${payout.net.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>≈ XLM received</span>
              <span>{(payout.net / XLM_USD_RATE).toFixed(2)} XLM</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <GamingButton
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={confirming}
              className="flex-1"
            >
              Cancel
            </GamingButton>
            <GamingButton
              variant="gold"
              size="sm"
              onClick={onConfirm}
              loading={confirming}
              className="flex-1"
            >
              Confirm Claim
            </GamingButton>
          </div>
        </div>
      </GlowCard>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CompletedPredictions() {
  const completedStakes = useStaking((s) => s.completedStakes());
  const claimStake = useStaking((s) => s.claimStake);
  const [confirmingStakeId, setConfirmingStakeId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [sortOpen, setSortOpen] = useState(false);

  const totalPredictions = completedStakes.length;
  const wonStakes = completedStakes.filter((s) => s.outcome === "won");
  const lostStakes = completedStakes.filter((s) => s.outcome === "lost");
  const winCount = wonStakes.length;
  const lossCount = lostStakes.length;
  const winRate = totalPredictions > 0 ? (winCount / totalPredictions) * 100 : 0;
  const totalProfit = completedStakes.reduce((sum, s) => sum + (s.profit ?? 0), 0);
  const bestWin = wonStakes.reduce((max, s) => Math.max(max, s.profit ?? 0), 0);
  const worstLoss = lostStakes.reduce((min, s) => Math.min(min, s.profit ?? -s.amount), 0);

  const filterTabs = [
    { key: "all", label: "All", count: totalPredictions },
    { key: "won", label: "Wins Only", count: winCount },
    { key: "lost", label: "Losses Only", count: lossCount },
  ];

  const filteredStakes = completedStakes.filter((stake) => {
    if (filter === "won") return stake.outcome === "won";
    if (filter === "lost") return stake.outcome === "lost";
    return true;
  });

  const sortedStakes = [...filteredStakes].sort((a, b) => {
    if (sortBy === "highest_win") {
      const profitA = a.profit ?? (a.outcome === "lost" ? -a.amount : 0);
      const profitB = b.profit ?? (b.outcome === "lost" ? -b.amount : 0);
      return profitB - profitA;
    }
    if (sortBy === "biggest_loss") {
      const profitA = a.profit ?? (a.outcome === "lost" ? -a.amount : 0);
      const profitB = b.profit ?? (b.outcome === "lost" ? -b.amount : 0);
      return profitA - profitB;
    }
    // "latest"
    const timeA = a.resolvedAt ? new Date(a.resolvedAt).getTime() : 0;
    const timeB = b.resolvedAt ? new Date(b.resolvedAt).getTime() : 0;
    return timeB - timeA;
  });

  const handleClaim = async (stake: Stake) => {
    if (processingId) return;
    setProcessingId(stake.id);
    setConfirmingStakeId(null);
    try {
      const { netPayout, netPayoutXLM } = await claimStake(stake.id);
      toast.success("Winnings Claimed! 🏆", {
        description: `+$${netPayout.toFixed(2)} USD (${netPayoutXLM.toFixed(2)} XLM) credited to your wallet.`,
        duration: 5000,
      });
    } catch (err) {
      toast.error("Claim failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (completedStakes.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="w-10 h-10" />}
        title="History Locked"
        description="Your resolved stakes will appear here once a poll is settled."
      />
    );
  }

  return (
    <>
      {/* Claim confirm dialog */}
      <AnimatePresence>
        {confirmingStakeId && (
          <ClaimConfirmDialog
            stake={completedStakes.find((s) => s.id === confirmingStakeId)!}
            onConfirm={() =>
              handleClaim(completedStakes.find((s) => s.id === confirmingStakeId)!)
            }
            onCancel={() => setConfirmingStakeId(null)}
            confirming={processingId === confirmingStakeId}
          />
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-surface border border-border clip-corner p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Total Predictions
            </div>
            <div className="font-display text-2xl font-black text-foreground">
              {totalPredictions}
            </div>
          </div>
          <div className="bg-surface border border-border clip-corner p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Wins / Losses
            </div>
            <div className="font-display text-2xl font-black text-foreground">
              <span className="text-success">{winCount}W</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="text-accent">{lossCount}L</span>
            </div>
          </div>
          <div className="bg-surface border border-border clip-corner p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Win Rate
            </div>
            <div className="font-display text-2xl font-black text-primary">
              {winRate.toFixed(1)}%
            </div>
          </div>
          <div className="bg-surface border border-border clip-corner p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Total P/L
            </div>
            <div
              className={`font-display text-2xl font-black ${totalProfit >= 0 ? "text-success" : "text-accent"}`}
            >
              {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(0)}
            </div>
          </div>
          <div className="bg-surface border border-border clip-corner p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Best Win
            </div>
            <div className="font-display text-2xl font-black text-success">
              +${bestWin.toFixed(0)}
            </div>
          </div>
          <div className="bg-surface border border-border clip-corner p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Worst Loss
            </div>
            <div className="font-display text-2xl font-black text-accent">
              {worstLoss < 0 ? `-$${Math.abs(worstLoss).toFixed(0)}` : "$0"}
            </div>
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 w-full sm:w-auto">
            <GamingTabs
              tabs={filterTabs}
              activeTab={filter}
              onChange={(key) => setFilter(key as FilterOption)}
            />
          </div>

          <div className="relative shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded clip-corner text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span>{SORT_OPTIONS.find((s) => s.key === sortBy)?.label}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-50 w-48"
                >
                  <GlowCard className="p-1">
                    <div className="relative z-20">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.key);
                            setSortOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded transition-colors ${
                            sortBy === opt.key
                              ? "bg-primary/20 text-primary font-bold"
                              : "text-muted-foreground hover:text-foreground hover:bg-surface"
                          }`}
                        >
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </GlowCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* History */}
        {sortedStakes.length === 0 ? (
          <div className="bg-surface/50 border border-border/50 rounded p-8 text-center text-muted-foreground text-sm">
            No completed predictions found for this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedStakes.map((stake) => {
              const won = stake.outcome === "won";
              const grossPayout =
                stake.grossPayout ??
                (stake.profit != null
                  ? stake.amount + stake.profit / 0.95
                  : stake.amount);
              const payout = won ? calculateCompletedPayout(stake.amount, grossPayout) : null;
              const isClaiming = processingId === stake.id;

              return (
                <motion.div
                  key={stake.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-surface border-2 clip-corner-lg p-5 transition-all ${
                    won
                      ? "border-success/30 hover:border-success/50"
                      : "border-accent/30 hover:border-accent/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {won ? (
                          <div className="flex items-center gap-2 px-2 py-1 bg-success/20 text-success rounded text-xs font-bold uppercase">
                            <TrendingUp className="h-3 w-3" />
                            WON
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-2 py-1 bg-accent/20 text-accent rounded text-xs font-bold uppercase">
                            <TrendingDown className="h-3 w-3" />
                            LOST
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">{stake.matchName}</div>
                      </div>
                      <h3 className="font-bold text-foreground">{stake.question}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatRelativeTime(stake.resolvedAt)}
                      </div>
                      {stake.transactionHash && (
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <span className="text-muted-foreground">Tx:</span>
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${stake.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground/80 hover:text-primary transition-colors underline decoration-dotted"
                            title="View on StellarExpert"
                          >
                            {truncateTxHash(stake.transactionHash)}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Your Side</div>
                      <div
                        className={`text-sm font-bold uppercase ${
                          stake.side === "yes" ? "text-success" : "text-accent"
                        }`}
                      >
                        {stake.side}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Stake</div>
                      <div className="text-sm font-mono font-bold">${stake.amount}</div>
                    </div>
                    {won && payout ? (
                      <>
                        {/* Fee breakdown */}
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Gross Share</div>
                          <div className="text-sm font-mono font-bold text-muted-foreground">
                            ${payout.gross.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Net Payout</div>
                          <div className="text-sm font-mono font-bold text-gold">
                            ${payout.net.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">P/L</div>
                          <div className="text-sm font-mono font-bold text-success">
                            +${payout.profit.toFixed(0)}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Net Payout</div>
                          <div className="text-sm font-mono font-bold text-muted-foreground">
                            $0.00
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">P/L</div>
                          <div className="text-sm font-mono font-bold text-accent">
                            ${stake.profit?.toFixed(0) ?? `-${stake.amount}`}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">ROI</div>
                          <div className="text-sm font-mono font-bold text-accent">
                            {stake.roi?.toFixed(0) ?? "-100"}%
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Claim button for won, unclaimed stakes */}
                  {won && !stake.claimed && (
                    <div className="pt-2 border-t border-success/20">
                      <GamingButton
                        variant="gold"
                        size="sm"
                        loading={isClaiming}
                        onClick={() => setConfirmingStakeId(stake.id)}
                        className="w-full sm:w-auto"
                      >
                        <Coins className="h-4 w-4 mr-2" />
                        Claim Winnings
                      </GamingButton>
                    </div>
                  )}

                  {/* Already claimed state */}
                  {won && stake.claimed && (
                    <div className="pt-2 border-t border-success/20 flex items-center gap-2 text-success text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-semibold">Winnings Claimed</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
