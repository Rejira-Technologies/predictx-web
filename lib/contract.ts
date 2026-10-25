/**
 * Soroban Smart Contract Integration & Service Layer (#20, #332)
 */

import * as StellarSdk from "@stellar/stellar-sdk";
import {
  sorobanServer,
  networkPassphrase,
  StellarError,
  type StellarErrorCode,
} from "./stellar";
import {
  pollToScVal,
  stakeToScVal,
  scValToPoll,
  scValToStake,
  xlmToStroops,
} from "./soroban-types";
import {
  POLLS as MOCK_RAW_POLLS,
  MOCK_STAKES as MOCK_RAW_STAKES,
  PLATFORM_STATS,
} from "./mock-data";
import type { Poll, Stake, PlatformStats, StellarPublicKey } from "@/types";

export { StellarError };
export type { StellarErrorCode };

/**
 * Toggle between mock and live on-chain data.
 * Defaults to true if NEXT_PUBLIC_USE_MOCK_DATA is 'true' or not explicitly 'false',
 * or if contract ID is not configured.
 */
export const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

export const PREDICTION_MARKET_CONTRACT =
  process.env.NEXT_PUBLIC_CONTRACT_PREDICTION_MARKET ||
  process.env.NEXT_PUBLIC_CONTRACT_ID ||
  "";

export const POLL_CONTRACT =
  process.env.NEXT_PUBLIC_CONTRACT_POLL ||
  process.env.NEXT_PUBLIC_CONTRACT_ID ||
  "";

export interface TransactionResult {
  status: "SUCCESS" | "FAILED" | "PENDING";
  hash?: string;
  error?: string;
  returnValue?: unknown;
}

/**
 * Normalise mock-data Poll to @/types Poll
 */
function toDomainPoll(raw: (typeof MOCK_RAW_POLLS)[number]): Poll {
  const totalPool = raw.yesPool + raw.noPool;
  const yesPercentage =
    totalPool > 0 ? Math.round((raw.yesPool / totalPool) * 100) : 50;
  const noPercentage = totalPool > 0 ? 100 - yesPercentage : 50;

  return {
    id: raw.id,
    matchId: raw.matchId,
    question: raw.question,
    category: (raw.category === "player_event"
      ? "player-event"
      : raw.category === "team_event"
      ? "team-event"
      : raw.category === "score_prediction"
      ? "score-prediction"
      : "other") as Poll["category"],
    yesPool: raw.yesPool,
    noPool: raw.noPool,
    totalPool,
    yesPercentage,
    noPercentage,
    yesParticipants: Math.round(raw.participants * (yesPercentage / 100)),
    noParticipants: Math.round(raw.participants * (noPercentage / 100)),
    lockTime: raw.lockTargetISO || new Date().toISOString(),
    status: raw.status as Poll["status"],
    result: raw.outcome ?? null,
    createdBy: "GDKXJNLE2YQFPQZ5TK3VZRKPTMJ4OLR3QB7IU6FSCZ6KQF7H4V29F3H" as StellarPublicKey,
    createdAt: new Date().toISOString(),
    stakes: [],
    votes: [],
    recentActivity: raw.recentActivity,
  };
}

/**
 * Normalise mock-data Stake to @/types Stake
 */
function toDomainStake(raw: (typeof MOCK_RAW_STAKES)[number]): Stake {
  return {
    id: raw.id,
    pollId: raw.pollId,
    matchId: raw.matchId,
    userId: (raw.wallet || "GDKXJNLE2YQFPQZ5TK3VZRKPTMJ4OLR3QB7IU6FSCZ6KQF7H4V29F3H") as StellarPublicKey,
    side: raw.side,
    amount: raw.amount,
    timestamp: new Date().toISOString(),
    status: (raw.status === "active"
      ? "active"
      : raw.status === "completed"
      ? (raw.outcome === "won" ? "won" : "lost")
      : "pending-resolution") as Stake["status"],
    actualWinnings: raw.grossPayout,
    roi: raw.roi,
  };
}

const DOMAIN_POLLS: Poll[] = MOCK_RAW_POLLS.map(toDomainPoll);
const DOMAIN_STAKES: Stake[] = MOCK_RAW_STAKES.map(toDomainStake);

/**
 * Dynamically import freighter signTransaction in client environment
 */
async function signWithFreighter(xdrString: string): Promise<string> {
  try {
    const freighter = await import("@stellar/freighter-api");
    const result = await freighter.signTransaction(xdrString, {
      networkPassphrase,
    });
    if (!result) {
      throw new StellarError("Transaction signing was cancelled by the user", "USER_REJECTED");
    }
    return typeof result === "string" ? result : (result as any).signedTxXdr || xdrString;
  } catch (err: any) {
    if (err instanceof StellarError) throw err;
    if (err?.message?.includes("User declined") || err?.message?.includes("reject") || err?.message?.includes("cancel")) {
      throw new StellarError("Transaction rejected by user", "USER_REJECTED", err);
    }
    throw new StellarError(err?.message || "Wallet signing failed", "WALLET_NOT_FOUND", err);
  }
}

/**
 * Poll transaction status from Soroban RPC until terminal state
 */
async function pollTransactionStatus(
  txHash: string,
  maxAttempts = 10,
  intervalMs = 1500,
): Promise<TransactionResult> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    try {
      const txResponse = await sorobanServer.getTransaction(txHash);
      if (txResponse.status === "SUCCESS") {
        return {
          status: "SUCCESS",
          hash: txHash,
          returnValue: txResponse.returnValue ? StellarSdk.scValToNative(txResponse.returnValue) : undefined,
        };
      }
      if (txResponse.status === "FAILED") {
        return {
          status: "FAILED",
          hash: txHash,
          error: "Transaction execution failed on ledger",
        };
      }
    } catch {
      // Continue polling
    }
  }
  return { status: "PENDING", hash: txHash };
}

/**
 * Helper executing simulate -> assemble -> sign -> submit pipeline
 */
export async function executeContractCall(
  publicKey: string,
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
): Promise<TransactionResult> {
  if (!contractId) {
    throw new StellarError("Contract ID is not configured", "NETWORK_ERROR");
  }

  try {
    // 1. Load account from Horizon / Soroban RPC
    const account = await sorobanServer.getAccount(publicKey);

    // 2. Build transaction
    const contract = new StellarSdk.Contract(contractId);
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: "100", // 100 stroops base fee
      networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    // 3. Simulate to estimate resources
    const simulated = await sorobanServer.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
      throw new StellarError(simulated.error, "TX_FAILED", simulated);
    }

    // 4. Prepare transaction
    const prepared = StellarSdk.rpc.assembleTransaction(tx, simulated).build();

    // 5. Sign with Freighter
    const signedXdr = await signWithFreighter(prepared.toXDR());

    // 6. Submit to Soroban RPC
    const signed = StellarSdk.TransactionBuilder.fromXDR(signedXdr, networkPassphrase) as StellarSdk.Transaction;
    const sendResult = await sorobanServer.sendTransaction(signed);

    // 7. Handle response or poll
    if (sendResult.status === "PENDING") {
      return await pollTransactionStatus(sendResult.hash);
    }

    const statusStr: string = sendResult.status;
    if (statusStr === "SUCCESS") {
      return { status: "SUCCESS", hash: sendResult.hash };
    }

    throw new StellarError(`Transaction failed with status: ${sendResult.status}`, "TX_FAILED", sendResult);
  } catch (err: any) {
    if (err instanceof StellarError) throw err;
    throw new StellarError(err?.message || "Failed to execute contract call", "TX_FAILED", err);
  }
}

// ─── Read Operations ───────────────────────────────────────────────

/**
 * Fetches all polls. Falls back to mock polls when USE_MOCK is true or contract is unset.
 */
export async function getPolls(): Promise<Poll[]> {
  if (USE_MOCK || !POLL_CONTRACT) {
    return DOMAIN_POLLS;
  }
  try {
    const contract = new StellarSdk.Contract(POLL_CONTRACT);
    // Simulation call for read operation
    const tx = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7", "0"),
      { fee: "100", networkPassphrase }
    )
      .addOperation(contract.call("get_polls"))
      .setTimeout(30)
      .build();

    const sim = await sorobanServer.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      const nativeVal = StellarSdk.scValToNative(sim.result.retval);
      if (Array.isArray(nativeVal)) {
        return nativeVal.map((p) => scValToPoll(StellarSdk.nativeToScVal(p)));
      }
    }
    return DOMAIN_POLLS;
  } catch {
    return DOMAIN_POLLS;
  }
}

/**
 * Fetches a single poll by ID. Falls back to mock data if USE_MOCK is true or contract is unset.
 */
export async function getPollById(pollId: string): Promise<Poll | null> {
  if (USE_MOCK || !POLL_CONTRACT) {
    return DOMAIN_POLLS.find((p) => p.id === pollId) || null;
  }
  try {
    const contract = new StellarSdk.Contract(POLL_CONTRACT);
    const tx = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7", "0"),
      { fee: "100", networkPassphrase }
    )
      .addOperation(contract.call("get_poll", StellarSdk.nativeToScVal(pollId, { type: "string" })))
      .setTimeout(30)
      .build();

    const sim = await sorobanServer.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      return scValToPoll(sim.result.retval);
    }
    return DOMAIN_POLLS.find((p) => p.id === pollId) || null;
  } catch {
    return DOMAIN_POLLS.find((p) => p.id === pollId) || null;
  }
}

/**
 * Fetches all polls associated with a match ID.
 */
export async function getMatchPolls(matchId: string): Promise<Poll[]> {
  const all = await getPolls();
  return all.filter((p) => p.matchId === matchId);
}

/**
 * Fetches all stakes for a given user public key.
 */
export async function getUserStakes(publicKey: string): Promise<Stake[]> {
  if (USE_MOCK || !PREDICTION_MARKET_CONTRACT) {
    return DOMAIN_STAKES.filter((s) => !publicKey || s.userId === publicKey);
  }
  try {
    const contract = new StellarSdk.Contract(PREDICTION_MARKET_CONTRACT);
    const tx = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7", "0"),
      { fee: "100", networkPassphrase }
    )
      .addOperation(
        contract.call("get_user_stakes", new StellarSdk.Address(publicKey).toScVal())
      )
      .setTimeout(30)
      .build();

    const sim = await sorobanServer.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      const nativeStakes = StellarSdk.scValToNative(sim.result.retval);
      if (Array.isArray(nativeStakes)) {
        return nativeStakes.map((s) => scValToStake(StellarSdk.nativeToScVal(s)));
      }
    }
    return DOMAIN_STAKES.filter((s) => !publicKey || s.userId === publicKey);
  } catch {
    return DOMAIN_STAKES.filter((s) => !publicKey || s.userId === publicKey);
  }
}

/**
 * Fetches platform-wide statistics.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  if (USE_MOCK || !PREDICTION_MARKET_CONTRACT) {
    return PLATFORM_STATS;
  }
  try {
    const contract = new StellarSdk.Contract(PREDICTION_MARKET_CONTRACT);
    const tx = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7", "0"),
      { fee: "100", networkPassphrase }
    )
      .addOperation(contract.call("get_platform_stats"))
      .setTimeout(30)
      .build();

    const sim = await sorobanServer.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      const raw = StellarSdk.scValToNative(sim.result.retval) as Record<string, any>;
      return {
        totalValueLocked: Number(raw.total_value_locked ?? PLATFORM_STATS.totalValueLocked),
        activePredictions: Number(raw.active_predictions ?? PLATFORM_STATS.activePredictions),
        communityMembers: Number(raw.community_members ?? PLATFORM_STATS.communityMembers),
        totalPayouts: Number(raw.total_payouts ?? PLATFORM_STATS.totalPayouts),
      };
    }
    return PLATFORM_STATS;
  } catch {
    return PLATFORM_STATS;
  }
}

// ─── Write Operations ──────────────────────────────────────────────

/**
 * Creates a new poll on the Soroban smart contract.
 */
export async function createPoll(
  creatorPublicKey: string,
  matchId: string,
  question: string,
  options: string[],
  stakeAmount: number,
): Promise<TransactionResult> {
  if (USE_MOCK || !POLL_CONTRACT) {
    return {
      status: "SUCCESS",
      hash: "mock_tx_" + Math.random().toString(36).substring(2, 10),
    };
  }

  const args = [
    new StellarSdk.Address(creatorPublicKey).toScVal(),
    StellarSdk.nativeToScVal(matchId, { type: "string" }),
    StellarSdk.nativeToScVal(question, { type: "string" }),
    StellarSdk.nativeToScVal(options),
    StellarSdk.nativeToScVal(xlmToStroops(stakeAmount), { type: "i128" }),
  ];

  return executeContractCall(creatorPublicKey, POLL_CONTRACT, "create_poll", args);
}

/**
 * Places a stake/bet on a poll outcome.
 */
export async function placeBet(
  userPublicKey: string,
  pollId: string,
  optionIndex: number,
  amount: number,
): Promise<TransactionResult> {
  if (USE_MOCK || !PREDICTION_MARKET_CONTRACT) {
    return {
      status: "SUCCESS",
      hash: "mock_tx_" + Math.random().toString(36).substring(2, 10),
    };
  }

  const args = [
    new StellarSdk.Address(userPublicKey).toScVal(),
    StellarSdk.nativeToScVal(pollId, { type: "string" }),
    StellarSdk.nativeToScVal(optionIndex, { type: "u32" }),
    stakeToScVal(amount),
  ];

  return executeContractCall(
    userPublicKey,
    PREDICTION_MARKET_CONTRACT,
    "place_bet",
    args,
  );
}

/**
 * Casts a resolution vote on a poll outcome.
 */
export async function castVote(
  userPublicKey: string,
  pollId: string,
  optionIndex: number,
): Promise<TransactionResult> {
  if (USE_MOCK || !POLL_CONTRACT) {
    return {
      status: "SUCCESS",
      hash: "mock_tx_" + Math.random().toString(36).substring(2, 10),
    };
  }

  const args = [
    new StellarSdk.Address(userPublicKey).toScVal(),
    StellarSdk.nativeToScVal(pollId, { type: "string" }),
    StellarSdk.nativeToScVal(optionIndex, { type: "u32" }),
  ];

  return executeContractCall(userPublicKey, POLL_CONTRACT, "cast_vote", args);
}

/**
 * Claims winnings for a resolved poll.
 */
export async function claimWinnings(
  userPublicKey: string,
  pollId: string,
): Promise<TransactionResult> {
  if (USE_MOCK || !PREDICTION_MARKET_CONTRACT) {
    return {
      status: "SUCCESS",
      hash: "mock_tx_" + Math.random().toString(36).substring(2, 10),
    };
  }

  const args = [
    new StellarSdk.Address(userPublicKey).toScVal(),
    StellarSdk.nativeToScVal(pollId, { type: "string" }),
  ];

  return executeContractCall(
    userPublicKey,
    PREDICTION_MARKET_CONTRACT,
    "claim_winnings",
    args,
  );
}
