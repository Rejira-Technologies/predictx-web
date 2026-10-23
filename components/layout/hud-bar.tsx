"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, Activity, Star } from "lucide-react";
import { useProgress } from "@/hooks/use-progress";
import { useWallet } from "@/hooks/use-wallet";
import { formatXLM } from "@/lib/calculations";
import { cn } from "@/lib/utils";

/**
 * HudBar — desktop top-strip / mobile integration bar
 *
 * Shows:
 *  • Rank chip (BadgeComponent-style, cyberpunk)
 *  • XP progress bar to next rank
 *  • Active-poll pulse (data-driven, not a timer)
 *  • Wallet balance (XLM) when connected
 *
 * Desktop: fixed strip below the header (inside header height block).
 * Mobile:  rendered as a compact strip above the bottom nav, hidden
 *          if the wallet is disconnected to keep the nav uncluttered.
 */
export function HudBar() {
  const { xp, rank, nextRank, progressPercent, xpToNextRank, activePoolCount } =
    useProgress();
  const { isConnected, balance } = useWallet();

  if (!isConnected) return null;

  return (
    <>
      {/* ── Desktop HUD strip ───────────────────────────────────────────── */}
      <div
        role="region"
        className="hidden md:flex fixed top-16 left-0 w-full z-40 items-center gap-4 px-6 py-1.5 border-b border-primary/10 bg-background/80 backdrop-blur-sm"
        aria-label="Player HUD"
      >
        {/* Rank chip */}
        <RankChip rankName={rank.name} color={rank.color} glowColor={rank.glowColor} />

        {/* XP bar */}
        <XpBar
          xp={xp}
          progressPercent={progressPercent}
          nextRank={nextRank?.name ?? null}
          xpToNextRank={xpToNextRank}
          color={rank.color}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Active polls pulse */}
        <ActivePollsPulse count={activePoolCount} />

        {/* Wallet balance */}
        <WalletBalance balance={balance} />
      </div>

      {/* ── Mobile HUD strip (above bottom nav) ────────────────────────── */}
      <div
        role="region"
        className="md:hidden fixed bottom-[56px] left-0 w-full z-40 flex items-center gap-3 px-4 py-1 
                   bg-background/90 backdrop-blur-md border-t border-primary/20"
        aria-label="Player HUD"
      >
        {/* Compact rank */}
        <RankChip rankName={rank.name} color={rank.color} glowColor={rank.glowColor} compact />

        {/* Compact XP bar */}
        <div className="flex-1">
          <XpBar
            xp={xp}
            progressPercent={progressPercent}
            nextRank={nextRank?.name ?? null}
            xpToNextRank={xpToNextRank}
            color={rank.color}
            compact
          />
        </div>

        {/* Active polls pulse (compact) */}
        <ActivePollsPulse count={activePoolCount} compact />
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface RankChipProps {
  rankName: string;
  color: string;
  glowColor: string;
  compact?: boolean;
}

function RankChip({ rankName, color, glowColor, compact }: RankChipProps) {
  return (
    <motion.div
      className={cn(
        "relative inline-flex items-center gap-1.5 px-2.5 font-display font-bold uppercase tracking-wider",
        compact ? "py-0.5 text-[10px]" : "py-1 text-xs",
      )}
      style={{
        clipPath:
          "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)",
        background: `${color}18`,
        border: `1px solid ${color}50`,
        boxShadow: `0 0 10px ${glowColor}`,
        color,
      }}
      animate={{
        boxShadow: [
          `0 0 8px ${glowColor.replace(/[\d.]+\)$/, "0.2)")}`,
          `0 0 16px ${glowColor}`,
          `0 0 8px ${glowColor.replace(/[\d.]+\)$/, "0.2)")}`,
        ],
      }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <Star className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {rankName}
    </motion.div>
  );
}

interface XpBarProps {
  xp: number;
  progressPercent: number;
  nextRank: string | null;
  xpToNextRank: number;
  color: string;
  compact?: boolean;
}

function XpBar({ xp, progressPercent, nextRank, xpToNextRank, color, compact }: XpBarProps) {
  return (
    <div className={cn("flex items-center gap-2", compact ? "w-full" : "w-48")}>
      {/* XP label */}
      {!compact && (
        <div className="flex items-center gap-1 shrink-0">
          <Zap className="h-3 w-3" style={{ color }} />
          <span className="text-xs font-mono font-bold" style={{ color }}>
            {xp} XP
          </span>
        </div>
      )}

      {/* Track */}
      <div
        className="relative flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: `${color}20` }}
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`XP progress: ${progressPercent}%`}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {/* Shimmer */}
        <motion.div
          className="absolute inset-y-0 w-8 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
          }}
          animate={{ x: ["-100%", "400%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
        />
      </div>

      {/* Next rank hint */}
      {!compact && nextRank && (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
          {xpToNextRank} XP → {nextRank}
        </span>
      )}
    </div>
  );
}

interface ActivePollsPulseProps {
  count: number;
  compact?: boolean;
}

function ActivePollsPulse({ count, compact }: ActivePollsPulseProps) {
  return (
    <div className="flex items-center gap-1.5">
      {/* Pulsing dot — actual data, not a timer */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            className="relative"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <span
              className="block w-2 h-2 rounded-full"
              style={{ background: "#39ff14", boxShadow: "0 0 6px rgba(57,255,20,0.8)" }}
            />
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ background: "rgba(57,255,20,0.4)" }}
              animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Activity
        className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")}
        style={{ color: count > 0 ? "#39ff14" : "rgba(255,255,255,0.3)" }}
      />

      {!compact && (
        <span
          className="text-xs font-mono font-semibold"
          style={{ color: count > 0 ? "#39ff14" : "rgba(255,255,255,0.3)" }}
        >
          {count} live
        </span>
      )}
    </div>
  );
}

interface WalletBalanceProps {
  balance: number;
}

function WalletBalance({ balance }: WalletBalanceProps) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-mono">
      <span className="text-muted-foreground">BAL</span>
      <span className="text-primary font-bold">{formatXLM(balance)}</span>
    </div>
  );
}
