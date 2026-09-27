"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS, type Poll } from "@/lib/mock-data";
import { useMockData } from "@/hooks/use-mock-data";
import { useStaking } from "@/hooks/use-staking";
import { trackEvent } from "@/lib/analytics";
import { useWallet } from "@/hooks/use-wallet";
import {
  VOTER_REWARD_MIN,
  VOTER_REWARD_MAX,
  AUTO_APPROVE_THRESHOLD,
  XLM_USD_RATE,
} from "@/lib/constants";

export type VoteDecision = "yes" | "no" | "unclear";

interface VotingState {
  userVotes: Record<string, VoteDecision>;
  userEarnings: number;
  /** Tracks the number of real "unclear" votes cast per poll, keyed by pollId. */
  unclearVotesByPoll: Record<string, number>;
  availablePolls: () => Poll[];
  getVoteReward: (pollId: string) => number;
  castVote: (pollId: string, decision: VoteDecision) => Promise<void>;
  getAccuracy: () => number;
  /** Returns the real count of "unclear" votes cast for a poll (0 if none). */
  getUnclearVotes: (pollId: string) => number;
}

export const useVoting = create<VotingState>()(
  persist(
    (set, get) => ({
      userVotes: {},
      userEarnings: 0,
      unclearVotesByPoll: {},

      availablePolls: () => {
        const { polls } = useMockData.getState();
        const { stakes } = useStaking.getState();
        const { userVotes } = get();

        // Staked poll IDs
        const stakedPollIds = new Set(stakes.map((s) => s.pollId));

        return polls.filter(
          (p) =>
            p.status === "voting" &&
            !stakedPollIds.has(p.id) &&
            !userVotes[p.id],
        );
      },

      getVoteReward: (pollId: string) => {
        const poll = useMockData.getState().getPoll(pollId);
        if (!poll) return 0;
        const totalPool = poll.yesPool + poll.noPool;
        if (totalPool <= 0) return 0;
        // Interpolate rate between VOTER_REWARD_MIN (0.5%) and VOTER_REWARD_MAX (1%)
        // based on vote participation/consensus ratio towards AUTO_APPROVE_THRESHOLD
        const consensusRatio = Math.max(poll.yesPool, poll.noPool) / totalPool;
        const progress = Math.min(1, Math.max(0, (consensusRatio - 0.5) / (AUTO_APPROVE_THRESHOLD - 0.5)));
        const rate = VOTER_REWARD_MIN + (VOTER_REWARD_MAX - VOTER_REWARD_MIN) * progress;
        return totalPool * rate;
      },

      castVote: async (pollId: string, decision: VoteDecision) => {
        // Simulate network delay for the voting transaction
        await new Promise((resolve) => setTimeout(resolve, 800));

        const reward = get().getVoteReward(pollId);
        const rewardXLM = reward / XLM_USD_RATE;

        // Credit the reward to the connected wallet balance
        useWallet.getState().updateBalance(rewardXLM);

        set((state) => ({
          userVotes: { ...state.userVotes, [pollId]: decision },
          userEarnings: state.userEarnings + reward,
          // Increment the real unclear counter only when the user votes "unclear"
          unclearVotesByPoll:
            decision === "unclear"
              ? {
                  ...state.unclearVotesByPoll,
                  [pollId]: (state.unclearVotesByPoll[pollId] ?? 0) + 1,
                }
              : state.unclearVotesByPoll,
        }));

        // Analytics — no wallet addresses
        const poll = useMockData.getState().getPoll(pollId);
        trackEvent({
          name: "vote_cast",
          pollCategory: poll?.category ?? "other",
          matchId: poll?.matchId ?? "unknown",
          decision,
        });
      },

      getUnclearVotes: (pollId: string) => {
        return get().unclearVotesByPoll[pollId] ?? 0;
      },

      getAccuracy: () => {
        // Mock accuracy since we don't have historical resolution mapped back to user votes perfectly yet
        const votesCast = Object.keys(get().userVotes).length;
        if (votesCast === 0) return 0;
        // Mocking a high accuracy for UI demonstration
        return 89;
      },
    }),
    { name: STORAGE_KEYS.votes },
  ),
);
