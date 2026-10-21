"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MATCHES,
  POLLS,
  PLATFORM_STATS,
  STORAGE_KEYS,
  type Match,
  type Poll,
  type PlatformStats,
} from "@/lib/mock-data";
import { trackEvent } from "@/lib/analytics";

interface MockDataState {
  matches: Match[];
  polls: Poll[];
  platformStats: PlatformStats;
  /** Number of polls created by the current user (incremented on each addPoll call). */
  userCreatedPollCount: number;
  getMatch: (id: string) => Match | undefined;
  getPolls: (matchId: string) => Poll[];
  getPoll: (pollId: string) => Poll | undefined;
  /** Returns only matches whose status is "upcoming" — live and completed are excluded. */
  getUpcomingMatches: () => Match[];
  trendingPolls: () => Poll[];
  /**
   * Update pool amounts and track distinct staker wallets.
   *
   * @param pollId   - The poll to update.
   * @param side     - Which pool the stake goes into.
   * @param amount   - USD amount staked.
   * @param walletAddress - Wallet that placed the stake. When provided,
   *   `participants` reflects the number of *distinct* wallets, not
   *   the total number of stake transactions.
   */
  updatePollPool: (
    pollId: string,
    side: "yes" | "no",
    amount: number,
    walletAddress?: string,
  ) => void;
  addPoll: (poll: Poll) => void;
}

/**
 * Merge freshly-computed MATCHES timestamps into persisted state.
 *
 * MATCHES is evaluated at module-load time (every page load), so its `kickoff`
 * values are always relative to *now*.  Persisted state may have stale ISO
 * strings from a previous session.  We overwrite only the time-sensitive
 * `kickoff` and `status` fields while preserving any pool mutations the user
 * made in-session (e.g. `score` updates from live matches — those stay).
 */
function refreshMatchTimestamps(persisted: Match[]): Match[] {
  const freshById = new Map(MATCHES.map((m) => [m.id, m]));
  return persisted.map((m) => {
    const fresh = freshById.get(m.id);
    if (!fresh) return m;
    return { ...m, kickoff: fresh.kickoff, status: fresh.status };
  });
}

export const useMockData = create<MockDataState>()(
  persist(
    (set, get) => ({
      // Seed initial state from the always-fresh source constants.
      matches: MATCHES,
      polls: POLLS,
      platformStats: PLATFORM_STATS,
      userCreatedPollCount: 0,

      getMatch: (id) => get().matches.find((m) => m.id === id),

      getPolls: (matchId) => get().polls.filter((p) => p.matchId === matchId),

      getPoll: (pollId) => get().polls.find((p) => p.id === pollId),

      getUpcomingMatches: () => get().matches.filter((m) => m.status === "upcoming"),

      trendingPolls: () =>
        [...get().polls]
          .filter((p) => p.status === "active")
          .sort((a, b) => b.yesPool + b.noPool - (a.yesPool + a.noPool))
          .slice(0, 6),

      updatePollPool: (pollId, side, amount, walletAddress) =>
        set((s) => {
          const poll = s.polls.find((p) => p.id === pollId);

          // Dev warning: unknown poll id should never silently no-op
          if (!poll) {
            if (process.env.NODE_ENV !== "production") {
              console.warn(
                `[updatePollPool] Poll not found: "${pollId}". ` +
                  `Available IDs: ${s.polls.map((p) => p.id).join(", ")}`,
              );
            }
            return s; // no-op — leave state unchanged
          }

          return {
            polls: s.polls.map((p) => {
              if (p.id !== pollId) return p;

              // Build the updated stakers list (deduplicated)
              const currentStakers: string[] = Array.isArray(p.stakers)
                ? p.stakers
                : [];
              const updatedStakers =
                walletAddress && !currentStakers.includes(walletAddress)
                  ? [...currentStakers, walletAddress]
                  : currentStakers;

              // participants = number of distinct wallets
              // stakeCount   = total number of stake transactions
              return {
                ...p,
                yesPool: side === "yes" ? p.yesPool + amount : p.yesPool,
                noPool: side === "no" ? p.noPool + amount : p.noPool,
                stakeCount: (p.stakeCount ?? 0) + 1,
                stakers: updatedStakers,
                participants: walletAddress
                  ? updatedStakers.length
                  : p.participants + 1, // fallback: increment if no address given
              };
            }),
          };
        }),

      /** Prepend a newly-created poll so it appears immediately in all views. */
      addPoll: (poll) => {
        set((s) => ({
          polls: [poll, ...s.polls],
          userCreatedPollCount: s.userCreatedPollCount + 1,
        }));
        trackEvent({
          name: "poll_create",
          pollCategory: poll.category,
          matchId: poll.matchId,
        });
      },
    }),
    {
      name: STORAGE_KEYS.pools,
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<MockDataState> | undefined;
        const persistedMatches = persisted?.matches ?? [];
        const persistedPolls = persisted?.polls ?? [];

        const matchIds = new Set([
          ...MATCHES.map((match) => match.id),
          ...persistedMatches.map((match) => match.id),
        ]);
        const pollIds = new Set([
          ...POLLS.map((poll) => poll.id),
          ...persistedPolls.map((poll) => poll.id),
        ]);

        const nextMatches = Array.from(matchIds)
          .map((id) => {
            const persistedMatch = persistedMatches.find((m) => m.id === id);
            const freshMatch = MATCHES.find((m) => m.id === id);
            if (!persistedMatch && !freshMatch) return undefined;
            if (freshMatch && persistedMatch) {
              return {
                ...persistedMatch,
                kickoff: freshMatch.kickoff,
                status: freshMatch.status,
              };
            }
            return freshMatch ?? persistedMatch;
          })
          .filter((match): match is Match => Boolean(match));

        const nextPolls = Array.from(pollIds)
          .map((id) => {
            const persistedPoll = persistedPolls.find((poll) => poll.id === id);
            const freshPoll = POLLS.find((poll) => poll.id === id);
            if (!persistedPoll && !freshPoll) return undefined;
            if (freshPoll && persistedPoll) {
              const next = { ...persistedPoll, ...freshPoll };
              const stakers = Array.isArray(persistedPoll.stakers)
                ? persistedPoll.stakers
                : [];
              return {
                ...next,
                participants: stakers.length > 0 ? new Set(stakers).size : freshPoll.participants,
              };
            }
            return freshPoll ?? persistedPoll;
          })
          .filter((poll): poll is Poll => Boolean(poll));

        return {
          ...currentState,
          ...(persisted ?? {}),
          matches: nextMatches,
          polls: nextPolls,
        };
      },
    },
  ),
);
