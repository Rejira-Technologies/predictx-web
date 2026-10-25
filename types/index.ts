/**
 * TypeScript type definitions for PredictX
 */

// Placeholder for type exports
/*
 *
 * Import path 
 * Import via the `@/types` path alias configured in tsconfig.json.
 * @example
 *   import type { Poll, PollStatus, StellarPublicKey } from "@/types";
 */
/* Branded Primitive Types*/
/* @example
 *   const key = "GDKX...9F3H" as StellarPublicKey;
 */
export type StellarPublicKey = string & { readonly __brand: "StellarPublicKey" };

/**
 * A branded string type representing a Stellar / Soroban contract ID (C..., 56 characters).
 * Distinct from a user public key so the two are never confused at call sites.
 */
export type StellarContractId = string & { readonly __brand: "StellarContractId" };

/**
 * A branded string type representing a Stellar transaction hash (64 hex characters).
 * Maps directly to the hash returned by Horizon / Soroban RPC after submission.
 */
export type StellarTxHash = string & { readonly __brand: "StellarTxHash" };

/* Union / Literal Types*/

/** Lifecycle state of a football match. */
export type MatchStatus = "upcoming" | "live" | "completed";

/**
 * Classification of what a poll is predicting.
 *
 * - `player-event`      – e.g. "Will Salah score a goal?"
 * - `team-event`        – e.g. "Will Chelsea keep a clean sheet?"
 * - `score-prediction`  – e.g. "Will the match end 2-1?"
 * - `other`             – catch-all for edge-case questions
 */
export type PollCategory =
  | "player-event"
  | "team-event"
  | "score-prediction"
  | "other";

/**
 * Lifecycle state of a poll.
 *
 * - `active`           – accepting stakes
 * - `locked`           – match has started; no new stakes accepted
 * - `voting`           – community members are casting resolution votes
 * - `admin-review`     – consensus below AUTO_APPROVE_THRESHOLD; admin decides
 * - `multi-sig-review` – escalated; requires multi-sig authorisation
 * - `dispute`          – outcome contested by participants
 * - `resolved`         – final result recorded; winnings are claimable
 *
 * Maps 1-to-1 with the `PollStatus` enum in the Soroban contract.
 */
export type PollStatus =
  | "active"
  | "locked"
  | "voting"
  | "admin-review"
  | "multi-sig-review"
  | "dispute"
  | "resolved";

/**
 * State of an individual stake.
 *
 * - `active`              – poll not yet resolved
 * - `won`                 – user predicted correctly; winnings claimable
 * - `lost`                – user predicted incorrectly
 * - `pending-resolution`  – poll is in voting / review phase
 */
export type StakeStatus = "active" | "won" | "lost" | "pending-resolution";

/**
 * The current resolution pathway for a poll.
 * A strict subset of `PollStatus` values representing in-progress resolution.
 * Used as the type of `Poll.resolutionStatus` so the field is always
 * narrowed; avoids passing `"active"` or `"resolved"` where a resolution
 * pathway is expected.
 */
export type ResolutionStatus =
  | "voting"
  | "admin-review"
  | "multi-sig-review"
  | "dispute";

/**
 * Visual urgency level for countdown timers shown next to polls.
 *
 * Bands match the thresholds in `hooks/use-countdown.ts` `getStatus()`:
 * - `safe`     – plenty of time remaining (> 1 hour)
 * - `warning`  – approaching lock time (15–60 min)
 * - `urgent`   – close to lock (5–15 min)
 * - `critical` – imminent lock (< 5 min)
 * - `expired`  – deadline has passed; `CountdownTimer` switches to "Expired" state
 */
export type TimerStatus = "safe" | "warning" | "urgent" | "critical" | "expired";

/**
 * Supported Stellar wallet providers.
 * Only Stellar-native wallets are supported — NOT MetaMask, WalletConnect,
 * or Coinbase Wallet.
 */
export type WalletProvider = "freighter" | "lobstr" | "xbull";

/*Core domain Interfaces*/

/**
 * A football team participating in a match.
 */
export interface Team {
  /** Unique identifier for the team (slug or UUID). */
  id: string;
  /** Full club name, e.g. "Chelsea". */
  name: string;
  /** Three-letter abbreviation used in scores and league tables, e.g. "CHE". */
  shortName: string;
  /** URL or local asset path to the team's crest / logo image. */
  logo: string;
  /** Brand primary colour as a CSS hex string, e.g. "#034694". */
  primaryColor: string;
}

/**
 * A football match between two teams, with associated prediction polls.
 */
export interface Match {
  /** Unique match identifier. */
  id: string;
  /** Home team data. */
  homeTeam: Team;
  /** Away team data. */
  awayTeam: Team;
  /** Match date in ISO 8601 format (YYYY-MM-DD). */
  date: string;
  /** Kick-off time in 24-hour format, e.g. "15:00". */
  time: string;
  /** Stadium or venue name. */
  venue: string;
  /** Competition name, e.g. "Premier League". */
  league: string;
  /** Current lifecycle status of the match. */
  status: MatchStatus;
  /** Live or final score; absent when the match has not yet started. */
  score?: { home: number; away: number };
  /** All prediction polls associated with this match. */
  polls: Poll[];
}

/**
 * A binary prediction market attached to a match.
 * Users stake XLM (valued in USD for display) on either a "yes" or "no" outcome.
 *
 * Monetary pool fields carry USD display values now. When the Soroban contract
 * is integrated, populate the corresponding `*Stroops` fields from on-chain data
 * without renaming the existing USD fields.
 */
export interface Poll {
  /** Unique poll identifier. On-chain this is a u64 sequence; stored as string for URL safety. */
  id: string;
  /** ID of the parent match this poll belongs to. */
  matchId: string;
  /** Human-readable prediction question, e.g. "Will Palmer score a goal?". */
  question: string;
  /** Thematic category of the prediction. */
  category: PollCategory;
  /** Total USD value staked on the "yes" outcome (converted from XLM at current rate). */
  yesPool: number;
  /** Total USD value staked on the "no" outcome (converted from XLM at current rate). */
  noPool: number;
  /** Sum of yesPool and noPool; convenience field to avoid re-computation in templates. */
  totalPool: number;
  /** Proportion of the total pool staked on "yes", expressed as 0–100. */
  yesPercentage: number;
  /** Proportion of the total pool staked on "no", expressed as 0–100. */
  noPercentage: number;
  /** Number of unique wallets that staked on the "yes" side. */
  yesParticipants: number;
  /** Number of unique wallets that staked on the "no" side. */
  noParticipants: number;
  /** ISO datetime after which no new stakes are accepted (mirrors the contract's lock_timestamp). */
  lockTime: string;
  /** Current lifecycle status of the poll. */
  status: PollStatus;
  /**
   * Active resolution pathway when the poll is between `locked` and `resolved`.
   * Populated whenever `status` is a `ResolutionStatus` variant; absent otherwise.
   * Having this as a dedicated typed field (rather than casting `status`) lets
   * resolution-specific components accept `ResolutionStatus` directly.
   */
  resolutionStatus?: ResolutionStatus;
  /**
   * Final resolved outcome.
   * - `undefined` — poll has not yet entered the resolution phase.
   * - `null`      — poll is in resolution but a result has not yet been confirmed.
   * - `"yes"` / `"no"` — result confirmed; winnings are claimable.
   */
  result?: "yes" | "no" | null;
  /** Stellar public key (G...) of the account that created this poll. */
  createdBy: StellarPublicKey;
  /** ISO datetime when the poll was created. */
  createdAt: string;
  /** ISO datetime when the poll was resolved; absent until resolution completes. */
  resolvedAt?: string;
  /** All stakes placed on this poll. */
  stakes: Stake[];
  /** All community resolution votes cast on this poll. */
  votes: Vote[];
  /** Short activity blurb shown in the UI, e.g. "34 people staked Yes in last hour". */
  recentActivity?: string;
  // ── Soroban: fields populated by the on-chain contract ───────────────────
  /** Soroban: Raw yes-pool balance in stroops (i128 from contract); use for on-chain writes. */
  yesPoolStroops?: bigint;
  /** Soroban: Raw no-pool balance in stroops (i128 from contract); use for on-chain writes. */
  noPoolStroops?: bigint;
  /** Soroban: Contract-internal sequence number; used for idempotent invocations. */
  contractSeq?: number;
}

/**
 * An individual stake placed by a user on a poll outcome.
 *
 * `amount` stores the USD display value. `amountStroops` will be populated by
 * the Soroban contract and is the authoritative on-chain quantity. Both fields
 * coexist so components never need to change which field they read.
 */
export interface Stake {
  /** Unique stake identifier; mirrors the contract's stake_id u64 as a string. */
  id: string;
  /** ID of the poll this stake belongs to. */
  pollId: string;
  /** ID of the match (denormalised from the poll for efficient dashboard lookups). */
  matchId: string;
  /** Stellar public key (G...) of the user who placed the stake. */
  userId: StellarPublicKey;
  /** Which binary outcome the user staked on. */
  side: "yes" | "no";
  /** USD value of the stake at the time it was placed (converted from XLM at snapshot rate). */
  amount: number;
  /** ISO datetime when the stake was placed. */
  timestamp: string;
  /** Current resolution state of this stake. */
  status: StakeStatus;
  /** Estimated USD winnings if the user's side wins (computed at stake time, before fee). */
  potentialWinnings?: number;
  /** Actual USD winnings credited after resolution; absent until resolved. */
  actualWinnings?: number;
  /** Net return on investment as a percentage (after platform fee); absent until resolved. */
  roi?: number;
  /**
   * Stellar transaction hash confirming the on-chain stake.
   * Optional because the hash is not available until the transaction is confirmed;
   * during the mock phase, populate with a deterministic fake hash.
   */
  transactionHash?: StellarTxHash;
  // ── Soroban: fields populated by the on-chain contract ───────────────────
  /** Soroban: Stake amount in stroops (i128 from contract); authoritative on-chain quantity. */
  amountStroops?: bigint;
  /** Soroban: XLM/USD rate snapshotted at stake time; used to reconcile display vs on-chain. */
  xlmUsdRateSnapshot?: number;
}

/**
 * A community resolution vote cast by a user to determine a poll's outcome.
 * Voters are rewarded proportionally for voting with the majority consensus.
 */
export interface Vote {
  /** Unique vote identifier. */
  id: string;
  /** ID of the poll being voted on. */
  pollId: string;
  /** Stellar public key (G...) of the user casting this vote. */
  voterId: StellarPublicKey;
  /**
   * The voter's assessment of the poll outcome.
   * `"unclear"` is used when video or data evidence is genuinely ambiguous;
   * "unclear" votes are excluded from the consensus calculation.
   */
  vote: "yes" | "no" | "unclear";
  /** USD reward earned for voting with the consensus; zero if voted against majority. */
  reward: number;
  /** ISO datetime when the vote was cast. */
  timestamp: string;
  /** Whether the consensus reward has been paid out to the voter yet. */
  status: "cast" | "rewarded";
  // ── Soroban: fields populated by the on-chain contract ───────────────────
  /** Soroban: Reward amount in stroops (i128 from contract); authoritative on-chain quantity. */
  rewardStroops?: bigint;
}

/**
 * A registered PredictX user, identified by their Stellar wallet address.
 * Gamification fields (level, xp, badges) are stored off-chain.
 *
 * `contractId` is optional now but included so managed-account patterns
 * (where a Soroban contract acts on behalf of a user) never require a field rename.
 */
export interface User {
  /** Internal unique identifier (not the wallet address). */
  id: string;
  /** Full Stellar public key (G...) used for all on-chain interactions. */
  walletAddress: StellarPublicKey;
  /** Truncated display address shown in the UI, e.g. "GDKX...9F3H". */
  displayAddress: string;
  /** User's available balance in USD (converted from XLM at the current rate). */
  balance: number;
  /** User's available balance in XLM, the native Stellar token. */
  balanceXLM: number;
  /** Cumulative USD value of all winnings to date. */
  totalWinnings: number;
  /** Cumulative USD value of all losses to date. */
  totalLosses: number;
  /** Win rate as a decimal fraction (0–1), e.g. 0.65 equals 65%. */
  winRate: number;
  /** Achievement badges earned by this user. */
  badges: Badge[];
  /** Stakes placed on polls that have not yet been resolved. */
  activeStakes: Stake[];
  /** Historical stakes on polls that have been resolved. */
  completedPredictions: Stake[];
  /** History of resolution votes cast by this user. */
  votingHistory: Vote[];
  /** Gamification level derived from accumulated XP. */
  level: number;
  /** Total experience points accumulated across all activity. */
  xp: number;
  // ── Soroban: fields populated by the on-chain contract ───────────────────
  /**
   * Soroban: Optional contract ID (C...) if this user is a managed account
   * whose on-chain actions are proxied through a Soroban contract.
   */
  contractId?: StellarContractId;
}

/**
 * A gamification badge awarded to a user for reaching a milestone.
 */
export interface Badge {
  /** Unique badge identifier. */
  id: string;
  /** Display name, e.g. "Winning Streak", "Top Judge", "Early Predictor". */
  name: string;
  /** Human-readable description of how the badge is earned. */
  description: string;
  /** URL or icon identifier for the badge artwork. */
  icon: string;
  /** ISO datetime when this badge was awarded to the user. */
  earnedAt: string;
  /** Thematic classification of the badge. */
  type: "achievement" | "rank" | "streak";
}

/**
 * Snapshot of the connected Stellar wallet's state.
 * Drives wallet UI and guards transaction submission throughout the app.
 */
export interface WalletState {
  /** Whether a Stellar wallet is currently connected. */
  isConnected: boolean;
  /** Whether a wallet connection attempt is currently in progress. */
  isConnecting: boolean;
  /** Full Stellar public key (G...) of the connected account; null if disconnected. */
  address: StellarPublicKey | null;
  /** Truncated display address for UI rendering; null if disconnected. */
  displayAddress: string | null;
  /** Wallet balance in USD (converted from XLM at the current mock rate). */
  balance: number;
  /** Wallet balance in XLM, the native Stellar token. */
  balanceXLM: number;
  /** Which Stellar wallet extension is currently in use. */
  provider: WalletProvider | null;
  /** Stellar network the wallet is connected to. */
  network: "testnet" | "mainnet" | "futurenet";
  /** Human-readable error message from the last failed wallet operation; null otherwise. */
  error: string | null;
  // ── Soroban: fields populated by the on-chain contract ───────────────────
  /** Soroban: Raw XLM balance in stroops (i128); authoritative on-chain quantity. */
  balanceStroops?: bigint;
}

/**
 * A record of an on-chain Stellar transaction performed by the platform.
 * Uses Stellar-specific concepts: ledger sequence numbers and stroops-denominated fees.
 */
export interface Transaction {
  /** Internal unique identifier. */
  id: string;
  /** Stellar transaction hash (64-character alphanumeric string). */
  hash: StellarTxHash;
  /** Category of platform action this transaction represents. */
  type: "stake" | "claim-winnings" | "vote-reward" | "create-poll";
  /** USD value transferred or associated with this transaction. */
  amount: number;
  /**
   * Transaction fee expressed in XLM (not stroops) for display purposes.
   * The Stellar base fee is 100 stroops = 0.00001 XLM per operation.
   */
  fee: number;
  /** On-chain confirmation state of the transaction. */
  status: "pending" | "confirmed" | "failed";
  /** ISO datetime when the transaction was submitted to the network. */
  timestamp: string;
  /** Short human-readable label, e.g. "Staked $100 on Yes — Will Salah score?". */
  description: string;
  /** Stellar ledger sequence number in which this tx was included; absent while pending. */
  ledger?: number;
  // ── Soroban: fields populated by the on-chain contract ───────────────────
  /** Soroban: Fee in stroops (i128 from Horizon response); authoritative on-chain fee. */
  feeStroops?: bigint;
  /** Soroban: XDR envelope returned by the RPC; useful for re-submission on failure. */
  xdrEnvelope?: string;
}

/**
 * Aggregated platform-wide statistics displayed on the landing / dashboard page.
 */
export interface PlatformStats {
  /** Total USD value currently locked across all active polls. */
  totalValueLocked: number;
  /** Number of polls currently in the `active` status (accepting stakes). */
  activePredictions: number;
  /** Total number of unique wallet addresses registered on the platform. */
  communityMembers: number;
  /** Cumulative USD value paid out to winners since the platform launched. */
  totalPayouts: number;
}

/**
 * Form data collected when a user creates a new poll.
 * `lockTime` controls when staking closes relative to match events.
 */
export interface CreatePollForm {
  /** ID of the match this poll will be attached to. */
  matchId: string;
  /** Thematic category of the prediction question. */
  category: PollCategory;
  /** The prediction question text; must be POLL_QUESTION_MIN_LENGTH–POLL_QUESTION_MAX_LENGTH chars. */
  question: string;
  /**
   * When staking closes relative to match events, or "custom" for an explicit datetime.
   *
   * - `kickoff`  – staking closes at match kick-off
   * - `halftime` – staking closes at the half-time whistle
   * - `60min`    – staking closes at the 60-minute mark
   * - `custom`   – staking closes at the datetime provided in `customLockTime`
   */
  lockTime: "kickoff" | "halftime" | "60min" | "custom";
  /** ISO datetime for a custom lock time; required when `lockTime` is `"custom"`. */
  customLockTime?: string;
}

/**
 * Pre-submission winnings estimate shown before the user confirms a stake.
 * Displays potential ROI and platform fee breakdown.
 *
 * USD fields are populated now. XLM / stroops fields will be populated by the
 * Soroban contract without requiring a rename of any existing field.
 */
export interface WinningsCalculation {
  /** USD value the user intends to stake. */
  stakeAmount: number;
  /** Which outcome the user is staking on. */
  side: "yes" | "no";
  /** Current total USD in the "yes" pool at calculation time. */
  currentYesPool: number;
  /** Current total USD in the "no" pool at calculation time. */
  currentNoPool: number;
  /** Gross USD winnings if the user's side wins (before platform fee deduction). */
  estimatedWinnings: number;
  /** Estimated gross return on investment as a percentage. */
  estimatedROI: number;
  /** Platform fee deducted from gross winnings (PLATFORM_FEE_PERCENTAGE × estimatedWinnings). */
  platformFee: number;
  /** Net USD winnings after deducting the platform fee. */
  netWinnings: number;
  // ── Soroban: fields populated by the on-chain contract ───────────────────
  /** Soroban: Stake amount in stroops; used when invoking the contract directly. */
  stakeAmountStroops?: bigint;
  /** Soroban: Estimated net winnings in stroops (after fee); from contract simulation. */
  netWinningsStroops?: bigint;
}

