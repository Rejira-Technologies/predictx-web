"use client";

import { useMemo } from "react";
import { useStaking } from "@/hooks/use-staking";
import { useVoting } from "@/hooks/use-voting";
import { useMockData } from "@/hooks/use-mock-data";

// ─── Rank definitions ─────────────────────────────────────────────────────────

export interface Rank {
  name: string;
  minXP: number;
  maxXP: number;
  color: string;
  glowColor: string;
  variant: "neutral" | "success" | "gold" | "danger";
}

export const RANKS: Rank[] = [
  { name: "Rookie",     minXP: 0,    maxXP: 100,  color: "#00d9ff", glowColor: "rgba(0,217,255,0.4)",   variant: "neutral" },
  { name: "Contender", minXP: 100,  maxXP: 300,  color: "#39ff14", glowColor: "rgba(57,255,20,0.4)",   variant: "success" },
  { name: "Analyst",   minXP: 300,  maxXP: 600,  color: "#ffd700", glowColor: "rgba(255,215,0,0.4)",   variant: "gold"    },
  { name: "Expert",    minXP: 600,  maxXP: 1000, color: "#ff006e", glowColor: "rgba(255,0,110,0.4)",   variant: "danger"  },
  { name: "Legend",    minXP: 1000, maxXP: 9999, color: "#ffd700", glowColor: "rgba(255,215,0,0.6)",   variant: "gold"    },
];

// ─── XP calculation ───────────────────────────────────────────────────────────

/** XP earned per dollar staked (rounded down). */
const XP_PER_DOLLAR_STAKED = 0.5;
/** XP earned per vote cast. */
const XP_PER_VOTE = 10;

export interface ProgressState {
  xp: number;
  rank: Rank;
  nextRank: Rank | null;
  xpToNextRank: number;
  progressPercent: number; // 0–100 within current rank band
  stakeCount: number;
  voteCount: number;
  activePoolCount: number;
}

export function useProgress(): ProgressState {
  // #243: use wallet-scoped selector so seed data from other wallets is excluded
  const walletStakes = useStaking((s) => s.activeStakes());
  // #244: userVotes is a store action (function) — call it to get the vote map
  const userVotes = useVoting((s) => s.userVotes());
  const polls = useMockData((s) => s.polls);

  return useMemo(() => {
    const stakeCount = walletStakes.length;
    const voteCount = Object.keys(userVotes).length;
    const totalStaked = walletStakes.reduce((sum, s) => sum + s.amount, 0);

    const xp = Math.floor(
      totalStaked * XP_PER_DOLLAR_STAKED + voteCount * XP_PER_VOTE,
    );

    // Derive rank
    const rank =
      [...RANKS].reverse().find((r) => xp >= r.minXP) ?? RANKS[0];
    const rankIndex = RANKS.indexOf(rank);
    const nextRank = rankIndex < RANKS.length - 1 ? RANKS[rankIndex + 1] : null;

    const bandSize = rank.maxXP - rank.minXP;
    const xpInBand = xp - rank.minXP;
    const progressPercent = Math.min(
      100,
      Math.round((xpInBand / bandSize) * 100),
    );
    const xpToNextRank = nextRank ? nextRank.minXP - xp : 0;

    const activePoolCount = polls.filter(
      (p) => p.status === "active" || p.status === "voting",
    ).length;

    return {
      xp,
      rank,
      nextRank,
      xpToNextRank,
      progressPercent,
      stakeCount,
      voteCount,
      activePoolCount,
    };
  }, [walletStakes, userVotes, polls]);
}
