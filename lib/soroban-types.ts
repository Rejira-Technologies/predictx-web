/**
 * Soroban ScVal <-> TypeScript Conversion Utilities (#20, #332)
 */

import { xdr, nativeToScVal, scValToNative } from "@stellar/stellar-sdk";
import type { Poll, Stake, StellarPublicKey } from "@/types";

/** 1 XLM = 10,000,000 stroops */
export const STROOPS_PER_XLM = 10_000_000;

/**
 * Converts XLM amount (floating or integer) to stroops (integer bigint)
 */
export function xlmToStroops(xlmAmount: number): bigint {
  return BigInt(Math.floor(xlmAmount * STROOPS_PER_XLM));
}

/**
 * Converts stroops (integer or bigint) to XLM (number)
 */
export function stroopsToXlm(stroops: bigint | number): number {
  return Number(stroops) / STROOPS_PER_XLM;
}

/**
 * CreatePollInput definition matching contract parameters
 */
export interface CreatePollInput {
  matchId: string;
  question: string;
  options: string[];
  stakeAmount: number;
}

/**
 * Convert frontend CreatePollInput to Soroban ScVal
 */
export function pollToScVal(poll: CreatePollInput): xdr.ScVal {
  return nativeToScVal({
    match_id: poll.matchId,
    question: poll.question,
    options: poll.options,
    stake_amount: xlmToStroops(poll.stakeAmount),
  });
}

/**
 * Convert stake amount in XLM to Soroban ScVal (i128)
 */
export function stakeToScVal(amountXlm: number): xdr.ScVal {
  const stroops = xlmToStroops(amountXlm);
  return nativeToScVal(stroops, { type: "i128" });
}

/**
 * Convert Soroban ScVal to frontend Poll
 */
export function scValToPoll(val: xdr.ScVal): Poll {
  const raw = scValToNative(val) as Record<string, any>;
  const yesPoolStroops = BigInt(raw.yes_pool ?? raw.yesPool ?? 0);
  const noPoolStroops = BigInt(raw.no_pool ?? raw.noPool ?? 0);
  const totalStroops = yesPoolStroops + noPoolStroops;

  const yesPool = stroopsToXlm(yesPoolStroops);
  const noPool = stroopsToXlm(noPoolStroops);
  const totalPool = stroopsToXlm(totalStroops);

  const yesPercentage =
    totalPool > 0 ? Math.round((yesPool / totalPool) * 100) : 50;
  const noPercentage =
    totalPool > 0 ? 100 - yesPercentage : 50;

  return {
    id: String(raw.id ?? raw.poll_id ?? "0"),
    matchId: String(raw.match_id ?? raw.matchId ?? ""),
    question: String(raw.question ?? ""),
    category: raw.category ?? "team-event",
    yesPool,
    noPool,
    totalPool,
    yesPercentage,
    noPercentage,
    yesParticipants: Number(raw.yes_participants ?? raw.yesParticipants ?? 0),
    noParticipants: Number(raw.no_participants ?? raw.noParticipants ?? 0),
    lockTime: raw.lock_time ? new Date(Number(raw.lock_time) * 1000).toISOString() : new Date().toISOString(),
    status: raw.status ?? "active",
    resolutionStatus: raw.resolution_status ?? undefined,
    result: raw.result ?? undefined,
    createdBy: (raw.created_by ?? raw.creator ?? "") as StellarPublicKey,
    createdAt: raw.created_at ? new Date(Number(raw.created_at) * 1000).toISOString() : new Date().toISOString(),
    resolvedAt: raw.resolved_at ? new Date(Number(raw.resolved_at) * 1000).toISOString() : undefined,
    stakes: [],
    votes: [],
    yesPoolStroops,
    noPoolStroops,
    contractSeq: Number(raw.contract_seq ?? raw.sequence ?? 0),
  };
}

/**
 * Convert Soroban ScVal to frontend Stake
 */
export function scValToStake(val: xdr.ScVal): Stake {
  const raw = scValToNative(val) as Record<string, any>;
  const amountStroops = BigInt(raw.amount ?? raw.amount_stroops ?? 0);
  const amount = stroopsToXlm(amountStroops);

  return {
    id: String(raw.id ?? raw.stake_id ?? "0"),
    pollId: String(raw.poll_id ?? raw.pollId ?? ""),
    matchId: String(raw.match_id ?? raw.matchId ?? ""),
    userId: (raw.user_id ?? raw.voter ?? raw.user ?? "") as StellarPublicKey,
    side: raw.side === 1 || raw.side === "yes" ? "yes" : "no",
    amount,
    timestamp: raw.timestamp ? new Date(Number(raw.timestamp) * 1000).toISOString() : new Date().toISOString(),
    status: raw.status ?? "active",
    potentialWinnings: raw.potential_winnings ? stroopsToXlm(raw.potential_winnings) : undefined,
    actualWinnings: raw.actual_winnings ? stroopsToXlm(raw.actual_winnings) : undefined,
    amountStroops,
  };
}
