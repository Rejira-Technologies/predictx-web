/**
 * hooks/use-chain-data.ts
 *
 * Typed, zod-validated data-fetching hooks for on-chain state.
 *
 * Each hook wraps lib/query-client.useQuery with a named key and
 * a fetcher that:
 *   1. In SIMULATION_MODE reads from the Zustand mock store.
 *   2. Outside simulation calls the lib/stellar contract client.
 *
 * Hooks exported:
 *   usePool(pollId)       – pool info for a single poll
 *   usePollList(matchId?) – list of polls (optionally filtered by match)
 *   useStats()            – platform-wide statistics
 *
 * Cache invalidation:
 *   Call invalidatePool(pollId), invalidatePollList(), invalidateStats()
 *   after local mutations (stake / claim / create-poll).
 */

"use client";

import { z } from "zod";
import { useQuery, invalidateQueries } from "@/lib/query-client";
import { useMockData } from "@/hooks/use-mock-data";
import { getPoolInfo, getPlatformStats, SIMULATION_MODE } from "@/lib/stellar";
import { useWallet } from "@/hooks/use-wallet";
import type { StellarNetwork } from "@/lib/stellar";

// ── Polling intervals ──────────────────────────────────────────────────────

const LIVE_POLL_INTERVAL = 20_000;   // 20 s for active polls
const STATS_INTERVAL     = 60_000;   // 60 s for platform stats
const STALE_INTERVAL     = 120_000;  // 2 min for resolved / locked polls

// ── Zod schemas ────────────────────────────────────────────────────────────

export const PoolInfoSchema = z.object({
  pollId:       z.string(),
  yesPool:      z.number().nonnegative(),
  noPool:       z.number().nonnegative(),
  participants: z.number().int().nonnegative(),
  status:       z.enum(["active", "locked", "voting", "resolved", "cancelled"]),
  outcome:      z.enum(["yes", "no"]).nullable().optional(),
  resolvedAt:   z.string().optional(),
});

export type PoolInfo = z.infer<typeof PoolInfoSchema>;

export const PollSummarySchema = z.object({
  id:            z.string(),
  matchId:       z.string(),
  question:      z.string(),
  category:      z.string(),
  yesPool:       z.number(),
  noPool:        z.number(),
  participants:  z.number(),
  status:        z.string(),
  lockTime:      z.string(),
  recentActivity: z.string().optional(),
  outcome:       z.enum(["yes", "no"]).optional(),
});

export type PollSummary = z.infer<typeof PollSummarySchema>;

export const PlatformStatsSchema = z.object({
  totalValueLocked:  z.number(),
  activePredictions: z.number().int(),
  communityMembers:  z.number().int(),
  totalPayouts:      z.number(),
});

export type PlatformStatsData = z.infer<typeof PlatformStatsSchema>;

// ── Cache-key helpers ──────────────────────────────────────────────────────

const poolKey  = (pollId: string) => `pool:${pollId}`;
const pollsKey = (matchId?: string) => matchId ? `polls:${matchId}` : "polls:all";
const statsKey = () => "stats";

// ── Invalidation helpers (call after mutations) ────────────────────────────

/** Invalidate pool info for a poll — call after staking / claiming. */
export function invalidatePool(pollId: string) {
  invalidateQueries(poolKey(pollId));
  // Also bust any polls list that might contain this pool
  invalidateQueries("polls:", true);
}

/** Invalidate all polls lists — call after poll creation. */
export function invalidatePollList() {
  invalidateQueries("polls:", true);
}

/** Invalidate platform stats — call after any mutation that changes TVL. */
export function invalidateStats() {
  invalidateQueries(statsKey());
}

// ── usePool ────────────────────────────────────────────────────────────────

/**
 * Fetch pool info for a single poll.
 *
 * In SIMULATION_MODE reads from the Zustand mock store.
 * Polls every 20 s for active polls; uses a 2 min interval otherwise.
 */
export function usePool(pollId: string) {
  const network = useWallet((s) => s.network) as StellarNetwork;

  const fetcher = async (): Promise<PoolInfo> => {
    if (SIMULATION_MODE) {
      const poll = useMockData.getState().getPoll(pollId);
      if (!poll) throw new Error(`Poll ${pollId} not found`);

      const raw = {
        pollId:       poll.id,
        yesPool:      poll.yesPool,
        noPool:       poll.noPool,
        participants: poll.participants,
        status:       poll.status as PoolInfo["status"],
        outcome:      (poll.outcome as "yes" | "no" | null | undefined) ?? null,
      };
      return PoolInfoSchema.parse(raw);
    }

    const info = await getPoolInfo(pollId, network);
    if (!info) throw new Error(`No pool data returned for ${pollId}`);
    return PoolInfoSchema.parse(info);
  };

  // Determine refresh interval based on last known status
  const lastStatus = useMockData.getState().getPoll(pollId)?.status;
  const interval =
    lastStatus === "active" ? LIVE_POLL_INTERVAL : STALE_INTERVAL;

  return useQuery<PoolInfo>(poolKey(pollId), fetcher, {
    refreshInterval: interval,
    revalidateOnFocus: true,
  });
}

// ── usePollList ────────────────────────────────────────────────────────────

/**
 * Fetch the list of polls, optionally filtered to a specific match.
 *
 * In SIMULATION_MODE reads from the Zustand mock store.
 * Polls every 20 s.
 */
export function usePollList(matchId?: string) {
  const fetcher = async (): Promise<PollSummary[]> => {
    if (SIMULATION_MODE) {
      const polls = matchId
        ? useMockData.getState().getPolls(matchId)
        : useMockData.getState().polls;

      return polls.map((p) =>
        PollSummarySchema.parse({
          id:             p.id,
          matchId:        p.matchId,
          question:       p.question,
          category:       p.category,
          yesPool:        p.yesPool,
          noPool:         p.noPool,
          participants:   p.participants,
          status:         p.status,
          lockTime:       p.lockTime,
          recentActivity: p.recentActivity,
          outcome:        p.outcome,
        })
      );
    }

    // Non-simulation: would call a contract view or indexer API
    throw new Error("Non-simulation poll list fetching not yet implemented");
  };

  return useQuery<PollSummary[]>(pollsKey(matchId), fetcher, {
    refreshInterval: LIVE_POLL_INTERVAL,
    revalidateOnFocus: true,
  });
}

// ── useStats ───────────────────────────────────────────────────────────────

/**
 * Fetch platform-wide statistics.
 *
 * In SIMULATION_MODE reads from the Zustand mock store.
 * Polls every 60 s.
 */
export function useStats() {
  const network = useWallet((s) => s.network) as StellarNetwork;

  const fetcher = async (): Promise<PlatformStatsData> => {
    if (SIMULATION_MODE) {
      const stats = useMockData.getState().platformStats;
      return PlatformStatsSchema.parse(stats);
    }

    const onChain = await getPlatformStats(network);
    if (!onChain) throw new Error("No stats returned from contract");

    const stats = useMockData.getState().platformStats;
    return PlatformStatsSchema.parse({
      ...stats,
      totalValueLocked:  onChain.totalValueLocked,
      activePredictions: onChain.activePredictions,
      totalPayouts:      onChain.totalPayouts,
    });
  };

  return useQuery<PlatformStatsData>(statsKey(), fetcher, {
    refreshInterval: STATS_INTERVAL,
    revalidateOnFocus: false,
  });
}
