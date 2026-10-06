"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Calendar, CheckCircle, Trophy, Coins } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "./shared/empty-state";
import { GamingButton } from "./shared/gaming-button";
import { GlowCard } from "./shared/glow-card";
import { useStaking } from "@/hooks/use-staking";
import { calculateCompletedPayout } from "@/lib/calculations";
import { XLM_USD_RATE } from "@/lib/constants";
import type { Stake } from "@/lib/mock-data";

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

  const totalProfit = completedStakes.reduce((sum, s) => sum + (s.profit ?? 0), 0);
  const totalStaked = completedStakes.reduce((sum, s) => sum + s.amount, 0);
  const winCount = completedStakes.filter((s) => s.outcome === "won").length;
  const winRate = completedStakes.length > 0 ? (winCount / completedStakes.length) * 100 : 0;

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              Win Rate
            </div>
            <div className="font-display text-2xl font-black text-primary">
              {winRate.toFixed(0)}%
            </div>
          </div>
          <div className="bg-surface border border-border clip-corner p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Total ROI
            </div>
            <div
              className={`font-display text-2xl font-black ${totalProfit >= 0 ? "text-success" : "text-accent"}`}
            >
              {totalStaked > 0 ? ((totalProfit / totalStaked) * 100).toFixed(0) : "0"}%
            </div>
          </div>
        </div>

        {/* History */}
        <div className="space-y-3">
          {completedStakes.map((stake) => {
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
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Recently
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
                        <div className="text-xs text-muted-foreground mb-1">Platform Fee</div>
                        <div className="text-sm font-mono font-bold text-accent">
                          −${payout.fee.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Net Payout</div>
                        <div className="text-sm font-mono font-bold text-gold">
                          ${payout.net.toFixed(2)}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
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
      </div>
    </>
  );
}
