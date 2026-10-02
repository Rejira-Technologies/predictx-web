import { XLM_USD_RATE } from "@/lib/constants";

export interface WinningsCalculation {
	grossWinnings: number;
	platformFee: number;
	netWinnings: number;
	profit: number;
	roi: number;
}

export const PLATFORM_FEE = 0.05;
const FEE = PLATFORM_FEE;

/**
 * Computes fee-adjusted payout, profit, and ROI for a completed winning stake.
 *
 * @param stakeAmount The original amount staked
 * @param grossPayout The gross payout before platform fee
 */
export function calculateCompletedPayout(
	stakeAmount: number,
	grossPayout: number,
): { gross: number; fee: number; net: number; profit: number; roi: number } {
	const fee = grossPayout * PLATFORM_FEE;
	const net = grossPayout - fee;
	const profit = Number((net - stakeAmount).toFixed(2));
	const roi = Number(((profit / stakeAmount) * 100).toFixed(2));
	return { gross: grossPayout, fee, net, profit, roi };
}

export function calculatePotentialWinnings(
	stakeAmount: number,
	side: "yes" | "no",
	yesPool: number,
	noPool: number,
): WinningsCalculation {
	const winningSidePool = (side === "yes" ? yesPool : noPool) + stakeAmount;
	const totalPool = yesPool + noPool + stakeAmount;
	const gross = (stakeAmount / winningSidePool) * totalPool;
	const fee = gross * FEE;
	const net = gross - fee;
	const profit = net - stakeAmount;
	const roi = (profit / stakeAmount) * 100;
	return {
		grossWinnings: gross,
		platformFee: fee,
		netWinnings: net,
		profit,
		roi,
	};
}

export function calculatePoolPercentages(yesPool: number, noPool: number) {
	const total = yesPool + noPool;
	if (!total) return { yes: 50, no: 50 };
	return {
		yes: Math.round((yesPool / total) * 100),
		no: Math.round((noPool / total) * 100),
	};
}

export function formatCurrency(
	amount: number,
	locale: string = "en-US",
	currency: string = "USD",
): string {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
	}).format(amount);
}

export function formatCompactCurrency(
	amount: number,
	locale: string = "en-US",
	currency: string = "USD",
): string {
	if (amount >= 1e6) {
		return new Intl.NumberFormat(locale, {
			style: "currency",
			currency,
			notation: "compact",
			maximumFractionDigits: 1,
		}).format(amount);
	}
	if (amount >= 1e3) {
		return new Intl.NumberFormat(locale, {
			style: "currency",
			currency,
			notation: "compact",
			maximumFractionDigits: 1,
		}).format(amount);
	}
	return formatCurrency(amount, locale, currency);
}

export function formatAddress(addr: string): string {
	return addr.length < 8 ? addr : `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function formatXLM(amount: number, locale: string = "en-US"): string {
	return `${new Intl.NumberFormat(locale).format(Math.round(amount))} XLM`;
}

export function convertXlmToUsd(xlm: number): number {
	return xlm * XLM_USD_RATE;
}

export function convertUsdToXlm(usd: number): number {
	return usd / XLM_USD_RATE;
}

/* ── Poll locking ────────────────────────────────────────────────────────── */

/**
 * Minutes from kickoff at which each `LockTime` variant closes.
 *
 * `halftime` and `60min` are derived offsets rather than absolute times, so
 * they must live in exactly one place. They were previously duplicated as
 * bare `52 * 60 * 1000` / `65 * 60 * 1000` literals in two components, which
 * is how the two drifted apart from the documented values.
 *
 * The 65-minute value for `60min` is deliberate: it is 60 minutes of play plus
 * a 5-minute allowance for stoppage time, halftime, and scheduling delay.
 */
export const LOCK_OFFSET_MINUTES = {
	kickoff: 0,
	halftime: 52,
	"60min": 65,
} as const;

export type LockTimeKey = keyof typeof LOCK_OFFSET_MINUTES;

/**
 * Resolve the instant at which a poll stops accepting stakes, in epoch ms.
 *
 * @param kickoff   ISO kickoff timestamp of the parent match.
 * @param lockTime  Which of the three lock points this poll uses.
 * @returns Epoch milliseconds, or `NaN` if `kickoff` is unparseable.
 */
export function getLockTimestamp(
	kickoff: string,
	lockTime: LockTimeKey | string,
): number {
	const k = new Date(kickoff).getTime();
	if (Number.isNaN(k)) return Number.NaN;
	if (lockTime in LOCK_OFFSET_MINUTES) {
		return k + LOCK_OFFSET_MINUTES[lockTime as LockTimeKey] * 60_000;
	}
	// Custom lock time stored as ISO string
	const custom = new Date(lockTime).getTime();
	if (!Number.isNaN(custom)) return custom;
	return Number.NaN;
}

/** `getLockTimestamp` as an ISO string, for `useCountdown` and `<time>` elements. */
export function getLockTargetISO(
	kickoff: string,
	lockTime: LockTimeKey | string,
	lockTargetISO?: string,
): string {
	// Prefer an explicit lock timestamp when one has been persisted on the poll
	// (created with "custom" lock or pre-computed on creation).
	if (lockTargetISO) return lockTargetISO;

	// For known preset keys, derive from kickoff + offset
	if (lockTime in LOCK_OFFSET_MINUTES) {
		const t = getLockTimestamp(kickoff, lockTime as LockTimeKey);
		if (Number.isNaN(t)) return kickoff;
		return new Date(t).toISOString();
	}

	// Unknown value: treat as an already-computed ISO string (custom lock stored
	// directly on poll.lockTime for backward-compat with older persisted data).
	const d = new Date(lockTime);
	if (!Number.isNaN(d.getTime())) return lockTime;

	return kickoff;
}

/**
 * Whether a poll must no longer accept stakes.
 *
 * Deliberately **time-derived rather than read from `poll.status`**. Nothing in
 * the codebase ever transitions `poll.status` when a lock time passes, so
 * `status === "active"` stays true indefinitely — a poll showing a LOCKED
 * countdown would still accept stakes. The status is still honoured, because a
 * poll that has already been resolved or moved to voting must be closed
 * regardless of the clock.
 *
 * @param now Injected for testing; defaults to the current time.
 */
export function isPollLocked(
	poll: { status?: string; lockTime: LockTimeKey | string; lockTargetISO?: string },
	match: { kickoff: string } | undefined,
	now: number = Date.now(),
): boolean {
	if (!match) return false;
	if (poll.status && poll.status !== "active") return true;

	// Prefer an explicit lock timestamp if present
	if (poll.lockTargetISO) {
		const t = new Date(poll.lockTargetISO).getTime();
		if (!Number.isNaN(t)) return now >= t;
	}

	if (!(poll.lockTime in LOCK_OFFSET_MINUTES)) {
		// Treat as ISO datetime (custom lock stored directly on lockTime)
		const t = new Date(poll.lockTime).getTime();
		if (!Number.isNaN(t)) return now >= t;
		return false;
	}

	const lock = getLockTimestamp(match.kickoff, poll.lockTime as LockTimeKey);
	if (Number.isNaN(lock)) return false;
	return now >= lock;
}

/** Whole milliseconds until the lock, floored at 0. Drives countdown displays. */
export function msUntilLock(
	poll: { lockTime: LockTimeKey | string; lockTargetISO?: string },
	match: { kickoff: string } | undefined,
	now: number = Date.now(),
): number {
	if (!match) return 0;
	const lockISO = getLockTargetISO(match.kickoff, poll.lockTime, poll.lockTargetISO);
	const lock = new Date(lockISO).getTime();
	if (Number.isNaN(lock)) return 0;
	return Math.max(0, lock - now);
}

/* ── Voting window ────────────────────────────────────────────────────────── */

/**
 * Hours that community voting stays open after a poll locks.
 *
 * Mirrors `voting_window_seconds` (7200) in the contract. Previously this was
 * hardcoded as `2 * 60 * 60 * 1000` in `voting-card.tsx`, which is why the
 * constant existed but had no consumers.
 */
export const VOTING_WINDOW_MS = 2 * 60 * 60 * 1000;

/**
 * Epoch ms at which voting on a poll closes: the lock instant plus the voting
 * window.
 *
 * Uses the poll's own `lockTime` rather than raw kickoff, so a `"halftime"`
 * poll is not treated as having locked at kickoff.
 */
export function getVotingDeadline(
	poll: { lockTime: LockTimeKey | string; lockTargetISO?: string },
	match: { kickoff: string } | undefined,
): number {
	if (!match) return Number.NaN;
	const lockISO = getLockTargetISO(match.kickoff, poll.lockTime, poll.lockTargetISO);
	const lock = new Date(lockISO).getTime();
	if (Number.isNaN(lock)) return Number.NaN;
	return lock + VOTING_WINDOW_MS;
}

/**
 * Whether a vote on this poll is still accepted.
 *
 * Checked in three places — the card's buttons, the store's `availablePolls()`
 * filter, and inside `castVote` itself — because each alone is bypassable: the
 * UI can be stale, `availablePolls()` can be called from a component that
 * rendered before the deadline, and `castVote` is the only one that runs at
 * the moment of the write.
 */
export function isVotingOpen(
	poll: { status?: string; lockTime: LockTimeKey | string; lockTargetISO?: string },
	match: { kickoff: string } | undefined,
	now: number = Date.now(),
): boolean {
	if (!match) return false;
	// A poll must actually be in the voting phase. A still-open poll or one
	// already resolved is not votable regardless of the clock.
	if (poll.status !== "voting") return false;
	const deadline = getVotingDeadline(poll, match);
	if (Number.isNaN(deadline)) return false;
	return now < deadline;
}

/** ISO form of {@link getVotingDeadline}, for `CountdownTimer`. */
export function getVotingDeadlineISO(
	poll: { lockTime: LockTimeKey | string; lockTargetISO?: string },
	match: { kickoff: string } | undefined,
): string {
	const t = getVotingDeadline(poll, match);
	if (Number.isNaN(t)) return new Date().toISOString();
	return new Date(t).toISOString();
}


