"use client";

import { useMockData } from "@/hooks/use-mock-data";
import { useStaking } from "@/hooks/use-staking";
import { useVoting } from "@/hooks/use-voting";

// ─── Badge definition ─────────────────────────────────────────────────────────

export interface BadgeDefinition {
  id: string;
  label: string;
  description: string;
  /** Whether the current user has earned this badge. */
  earned: boolean;
  /** BadgeComponent variant */
  variant: "success" | "danger" | "neutral" | "gold";
  /** BadgeComponent type */
  type: "achievement" | "rank" | "streak" | "win" | "loss";
}

// ─── Pure badge rules (one function per badge — adding a 4th badge is a one-liner here) ──

type BadgeRule = (ctx: BadgeContext) => boolean;

interface BadgeContext {
  userCreatedPollCount: number;
  completedWonStakes: number;
  consecutiveWonStakes: number;
  totalVotesCast: number;
  hasEarlyStake: boolean;
}

const BADGE_DEFINITIONS: Omit<BadgeDefinition, "earned">[] = [
  {
    id: "early_predictor",
    label: "Early Predictor",
    description: "Staked within first 5 min of poll",
    variant: "neutral",
    type: "achievement",
  },
  {
    id: "winning_streak",
    label: "3-Win Streak",
    description: "Won 3 or more stakes in a row",
    variant: "gold",
    type: "streak",
  },
  {
    id: "top_judge",
    label: "Top Judge",
    description: "Voted on 10 or more polls accurately",
    variant: "success",
    type: "rank",
  },
];

const BADGE_RULES: Record<string, BadgeRule> = {
  early_predictor: (ctx) => ctx.hasEarlyStake || ctx.userCreatedPollCount >= 1,
  winning_streak: (ctx) => ctx.consecutiveWonStakes >= 3,
  top_judge: (ctx) => ctx.totalVotesCast >= 10,
};

// ─── Helper: compute longest consecutive won streak from completed stakes ─────

function longestConsecutiveWonStreak(
  completedStakes: Array<{ outcome?: "won" | "lost" }>,
): number {
  let best = 0;
  let current = 0;
  for (const stake of completedStakes) {
    if (stake.outcome === "won") {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return best;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBadges(): BadgeDefinition[] {
  const userCreatedPollCount = useMockData((s) => s.userCreatedPollCount);
  const completedStakes = useStaking((s) => s.completedStakes());
  const activeStakes = useStaking((s) => s.activeStakes());
  const userVotes = useVoting((s) => s.userVotes);
  // #244: userVotes is a store action (function) — call it to get the vote map
  const userVotes = useVoting((s) => s.userVotes());

  const allStakes = [...activeStakes, ...completedStakes];
  const hasEarlyStake = allStakes.some((s) => s.stakedWithinFirst5Min === true);

  const ctx: BadgeContext = {
    userCreatedPollCount,
    completedWonStakes: completedStakes.filter((s) => s.outcome === "won").length,
    consecutiveWonStakes: longestConsecutiveWonStreak(completedStakes),
    totalVotesCast: Object.keys(userVotes).length,
    hasEarlyStake,
  };

  return BADGE_DEFINITIONS.map((def) => ({
    ...def,
    earned: BADGE_RULES[def.id](ctx),
  }));
}
