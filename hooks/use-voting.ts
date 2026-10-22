"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS, type Poll } from "@/lib/mock-data";
import { useMockData } from "@/hooks/use-mock-data";
import { useStaking } from "@/hooks/use-staking";
import { useWallet } from "@/hooks/use-wallet";
import { useTransactions } from "@/hooks/use-transactions";
import { trackEvent } from "@/lib/analytics";
import {
  VOTER_REWARD_MIN,
  VOTER_REWARD_MAX,
  AUTO_APPROVE_THRESHOLD,
  XLM_USD_RATE,
} from "@/lib/constants";
import { isVotingOpen } from "@/lib/calculations";

export type VoteDecision = "yes" | "no" | "unclear";

/**
 * A reward that has been earned (vote cast, non-unclear, poll not yet resolved)
 * but not yet paid out.
 */
interface PendingReward {
  pollId: string;
  matchName: string;
  question: string;
  /** USD amount owed if vote is later confirmed correct */
  amount: number;
  /** The user's vote — "unclear" votes are never eligible */
  decision: VoteDecision;
}

export interface VoteTally {
  yes: number;
  no: number;
  unclear: number;
  total: number;
}

interface VotingState {
  /**
   * Votes are stored as a nested map: `{ [walletAddress]: { [pollId]: decision } }`.
   * Scoping them per wallet means switching accounts never leaks one user's
   * vote history - or their unpaid rewards - to another.
   */
  allVotes: Record<string, Record<string, VoteDecision>>;
  /** Rewards waiting for poll resolution, scoped per wallet then per poll. */
  pendingRewards: Record<string, Record<string, PendingReward>>;
  /** Total USD credited to the wallet after settlement — readable by UI */
  userEarnings: number;
  /** Tracks the number of real "unclear" votes cast per poll, keyed by pollId. */
  unclearVotesByPoll: Record<string, number>;
  communityVotes: Record<string, VoteDecision[]>; // Track all simulated community votes
  availablePolls: () => Poll[];
  getVoteReward: (pollId: string) => number;
  getTally: (pollId: string) => VoteTally;

  /** Votes cast by the currently-connected wallet (empty when disconnected). */
  userVotes: () => Record<string, VoteDecision>;

  /**
   * Record the user's vote.
   * - Stores the decision against the connected wallet (prevents double-voting).
   * - For non-unclear votes, queues a PendingReward owed-but-unpaid.
   * - "unclear" votes are recorded but earn nothing (farmable reward closed).
   * - Actual wallet credit + ledger entry only happen in settleRewards().
   */
  castVote: (pollId: string, decision: VoteDecision) => Promise<void>;

  /**
   * Settle pending rewards for any polls that have now resolved.
   * Call this whenever poll statuses are refreshed (e.g. on page focus).
   *
   * For each pending reward where:
   *   1. The corresponding poll is now "resolved"
   *   2. The poll has a known outcome ("yes" | "no")
   *   3. The user's non-unclear vote matches the outcome (consensus)
   *
   * The reward is: credited to the wallet balance, written as a
   * "vote_reward" ledger entry, and removed from pendingRewards.
   *
   * Votes that are "unclear" or that did not match the outcome are
   * removed from pendingRewards silently (no payout).
   */
  settleRewards: () => void;

  getAccuracy: () => number;
  /** Returns the real count of "unclear" votes cast for a poll (0 if none). */
  getUnclearVotes: (pollId: string) => number;
  initializeMockVotes: () => void;

  /**
   * Remove all votes and unpaid rewards stored for a wallet address.
   * Called on disconnect so the next wallet starts from a clean slate.
   */
  clearWalletVotes: (address: string) => void;
}

// Pre-seeded mock community votes for each poll (for initial load)
const MOCK_COMMUNITY_VOTES: Record<string, VoteDecision[]> = {
  "m6-p1": ["yes", "yes", "yes", "yes", "yes", "yes", "no", "no", "unclear"], // Everton win - lean yes
  "m6-p2": ["yes", "no", "yes", "no", "yes", "no", "yes", "unclear"], // Over 2.5 goals - mixed
  "m6-p3": ["no", "no", "no", "no", "no", "yes", "no", "unclear"], // Red card - mostly no
  "m6-p4": ["yes", "yes", "yes", "no", "no", "no", "unclear"], // Both teams score - slight lean yes
  "m6-p5": ["no", "no", "yes", "no", "unclear", "no", "yes"], // VAR review - lean no
  "m5-p1": ["yes", "yes", "yes", "yes", "yes", "no", "unclear"], // Brighton win - mostly yes
  "m5-p2": ["yes", "yes", "no", "yes", "no", "no", "unclear"], // Over 2.5 goals - mixed
  "m5-p3": ["yes", "no", "yes", "yes", "no", "no", "unclear"], // VAR review - mixed
  "m5-p4": ["no", "no", "yes", "no", "unclear", "no"], // Both score - mostly no
};

export const useVoting = create<VotingState>()(
  persist(
    (set, get) => ({
      allVotes: {},
      pendingRewards: {},
      userEarnings: 0,
      unclearVotesByPoll: {},
      communityVotes: MOCK_COMMUNITY_VOTES,

      userVotes: () => {
        const address = useWallet.getState().address;
        if (!address) return {};
        return get().allVotes[address] ?? {};
      },

      availablePolls: () => {
        const { polls, getMatch } = useMockData.getState();
        const { stakes } = useStaking.getState();
        const address = useWallet.getState().address;
        const myVotes = address ? get().allVotes[address] ?? {} : {};

        // Only the connected wallet's stakes block it from voting.
        const stakedPollIds = new Set(
          address
            ? stakes.filter((s) => s.wallet === address).map((s) => s.pollId)
            : [],
        );

        return polls.filter(
          (p) =>
            p.status === "voting" &&
            !stakedPollIds.has(p.id) &&
            !myVotes[p.id] &&
            // Exclude polls whose voting window has already closed. Without this
            // a completed match's polls stayed votable indefinitely — the
            // countdown beside the buttons read 00:00:00 while the vote still
            // succeeded and was paid out.
            isVotingOpen(p, getMatch(p.matchId)),
        );
      },


      getVoteReward: (pollId: string) => {
        const poll = useMockData.getState().getPoll(pollId);
        if (!poll) return 0;
        const totalPool = poll.yesPool + poll.noPool;
        if (totalPool <= 0) return 0;
        // Interpolate between VOTER_REWARD_MIN (0.5%) and VOTER_REWARD_MAX (1%)
        // based on the consensus ratio towards AUTO_APPROVE_THRESHOLD.
        const consensusRatio = Math.max(poll.yesPool, poll.noPool) / totalPool;
        const progress = Math.min(1, Math.max(0, (consensusRatio - 0.5) / (AUTO_APPROVE_THRESHOLD - 0.5)));
        const rate = VOTER_REWARD_MIN + (VOTER_REWARD_MAX - VOTER_REWARD_MIN) * progress;
        return totalPool * rate;
      },

      getTally: (pollId: string) => {
        const { communityVotes } = get();
        const allVotes = [...(communityVotes[pollId] || [])];
        const address = useWallet.getState().address;
        const myVotes = address ? get().allVotes[address] ?? {} : {};

        // Add the connected wallet's vote if they voted on this poll
        if (myVotes[pollId]) {
          allVotes.push(myVotes[pollId]);
        }

        const tally = {
          yes: allVotes.filter((v) => v === "yes").length,
          no: allVotes.filter((v) => v === "no").length,
          unclear: allVotes.filter((v) => v === "unclear").length,
          total: allVotes.length,
        };

        return tally;
      },

      castVote: async (pollId: string, decision: VoteDecision) => {
        /**
         * Re-checked at write time, not just at render time.
         *
         * This is the only check that cannot be bypassed: the card can be stale,
         * `availablePolls()` can be called by a component that rendered before
         * the deadline, and `poll.status` never transitions on its own. If the
         * window closed between opening the card and confirming, the vote must
         * not be recorded — and the reward must not be paid.
         */
        const { getPoll, getMatch } = useMockData.getState();
        const poll = getPoll(pollId);
        if (!poll) throw new Error("Poll not found");
        if (!isVotingOpen(poll, getMatch(poll.matchId))) {
          throw new Error("Voting has closed for this poll");
        }

        // Simulate network delay for the voting transaction
        await new Promise((resolve) => setTimeout(resolve, 800));

        const address = useWallet.getState().address;
        if (!address) {
          throw new Error("Connect a wallet to vote.");
        }

        // Re-check after the await. The deadline can pass during those 800ms,
        // and this is the last point before the write lands.
        if (!isVotingOpen(poll, getMatch(poll.matchId))) {
          throw new Error("Voting has closed for this poll");
        }

        let recorded = false;
        set((state) => {
          const myVotes = state.allVotes[address] ?? {};
          // Already voted — no-op (guard against double-submit races)
          if (myVotes[pollId]) return state;
          recorded = true;

          const newPendingForWallet = { ...(state.pendingRewards[address] ?? {}) };

          // "unclear" votes are recorded but earn nothing — reward is 0 and
          // no pending entry is queued, making it impossible to farm.
          if (decision !== "unclear") {
            const poll = useMockData.getState().getPoll(pollId);
            if (poll) {
              const reward = get().getVoteReward(pollId);
              const matchData = useMockData.getState().getMatch(poll.matchId);
              newPendingForWallet[pollId] = {
                pollId,
                matchName: matchData
                  ? `${matchData.homeTeam} vs ${matchData.awayTeam}`
                  : poll.matchId,
                question: poll.question,
                amount: reward,
                decision,
              };
            }
          }

          return {
            allVotes: {
              ...state.allVotes,
              [address]: { ...myVotes, [pollId]: decision },
            },
            pendingRewards: {
              ...state.pendingRewards,
              [address]: newPendingForWallet,
            },
            // Increment the real unclear counter only when the user votes "unclear"
            unclearVotesByPoll:
              decision === "unclear"
                ? {
                    ...state.unclearVotesByPoll,
                    [pollId]: (state.unclearVotesByPoll[pollId] ?? 0) + 1,
                  }
                : state.unclearVotesByPoll,
          };
        });

        if (!recorded) {
          throw new Error("You have already voted on this poll.");
        }

        // Analytics — no wallet addresses
        const votedPoll = useMockData.getState().getPoll(pollId);
        trackEvent({
          name: "vote_cast",
          pollCategory: votedPoll?.category ?? "other",
          matchId: votedPoll?.matchId ?? "unknown",
          decision,
        });
      },

      settleRewards: () => {
        const address = useWallet.getState().address;
        if (!address) return;
        const pendingRewards = get().pendingRewards[address] ?? {};
        if (Object.keys(pendingRewards).length === 0) return;

        const polls = useMockData.getState().polls;
        const pollMap = new Map(polls.map((p) => [p.id, p]));

        const wallet = useWallet.getState();
        const addTx = useTransactions.getState().addTransaction;

        let earned = 0;
        const remainingPending = { ...pendingRewards };

        for (const [pollId, pending] of Object.entries(pendingRewards)) {
          const poll = pollMap.get(pollId);
          if (!poll) {
            // Poll no longer exists — discard
            delete remainingPending[pollId];
            continue;
          }

          // Only settle polls that are fully resolved with a definitive outcome
          if (poll.status !== "resolved" || !poll.outcome) continue;


          // Remove from pending regardless of outcome (no payout if wrong/unclear)
          delete remainingPending[pollId];

          // Unclear decisions are ineligible (already blocked in castVote, but
          // guard here for any legacy state that might exist)
          if (pending.decision === "unclear") continue;

          // Reward is only paid if the user's vote matched the resolved outcome
          if (pending.decision !== poll.outcome) continue;

          // Eligible: credit wallet and write ledger entry
          const amountXLM = pending.amount / XLM_USD_RATE;
          wallet.updateBalance(amountXLM);
          earned += pending.amount;

          addTx({
            type: "vote_reward",
            amount: pending.amount,
            amountXLM,
            description: `Vote reward — "${pending.question}" (${pending.matchName})`,
            timestamp: new Date().toISOString(),
            status: "confirmed",
          });
        }

        set((s) => ({
          pendingRewards: { ...s.pendingRewards, [address]: remainingPending },
          userEarnings: s.userEarnings + earned,
        }));
      },

      getUnclearVotes: (pollId: string) => {
        return get().unclearVotesByPoll[pollId] ?? 0;
      },

      getAccuracy: () => {
        const address = useWallet.getState().address;
        const votesCast = address
          ? Object.keys(get().allVotes[address] ?? {}).length
          : 0;
        if (votesCast === 0) return 0;
        // Mock accuracy — real accuracy would compare the wallet's votes to
        // resolved poll outcomes.
        return 89;
      },

      initializeMockVotes: () => {
        // This is called during store initialization to ensure mock votes are loaded
        set((state) => ({
          communityVotes: { ...MOCK_COMMUNITY_VOTES, ...state.communityVotes },
        }));
      },

      clearWalletVotes: (address: string) =>
        set((state) => {
          const allVotes = { ...state.allVotes };
          delete allVotes[address];
          const pendingRewards = { ...state.pendingRewards };
          delete pendingRewards[address];
          return { allVotes, pendingRewards };
        }),
    }),
    { name: STORAGE_KEYS.votes },
  ),
);
