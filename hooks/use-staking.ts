import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_STAKES, STORAGE_KEYS, type Stake } from "@/lib/mock-data";
import {
	calculatePotentialWinnings,
	calculateCompletedPayout,
	calculateGrossPayout,
	type WinningsCalculation,
} from "@/lib/calculations";
import { XLM_USD_RATE } from "@/lib/constants";
import { useMockData } from "@/hooks/use-mock-data";
import { useWallet, type TransactionReceipt } from "@/hooks/use-wallet";
import { useTransactions } from "@/hooks/use-transactions";
import { trackEvent } from "@/lib/analytics";

/**
 * Maximum number of stakes kept in persisted storage.
 *
 * When the array exceeds this limit the oldest entries (lowest indices after
 * the prepend) are evicted.  The cap keeps the localStorage payload bounded
 * while retaining the most-recent activity for display.
 */
const MAX_STAKES = 200;

interface StakingState {
	/**
	 * All stakes ever recorded (across all wallets + seed data).
	 * Consumers should call the wallet-scoped selectors below instead of
	 * reading this array directly.
	 */
	stakes: Stake[];

	/** Stakes belonging to the currently connected wallet. */
	activeStakes: () => Stake[];
	pendingStakes: () => Stake[];
	completedStakes: () => Stake[];

	placeStake: (
		pollId: string,
		matchId: string,
		matchName: string,
		question: string,
		side: "yes" | "no",
		amount: number,
	) => Promise<{ stake: Stake; receipt: TransactionReceipt }>;
	calculateWinnings: (
		amount: number,
		side: "yes" | "no",
		yesPool: number,
		noPool: number,
	) => WinningsCalculation;

	/**
	 * Claim winnings for a won, unclaimed completed stake.
	 * Computes net payout (gross − 5% fee), credits wallet balance in XLM,
	 * and records a claim transaction.
	 */
	claimStake: (stakeId: string) => Promise<{ netPayout: number; netPayoutXLM: number }>;

	/** Remove all stakes that belong to the given wallet address.
	 *  Called on disconnect so the next wallet starts with a clean slate. */
	clearWalletStakes: (address: string) => void;
}

/** Return only stakes that belong to the connected wallet. */
function walletStakes(stakes: Stake[]): Stake[] {
	const address = useWallet.getState().address;
	if (!address) return [];
	return stakes.filter((s) => s.wallet === address);
}

export const useStaking = create<StakingState>()(
	persist(
		(set, get) => ({
			// Seed data is included so the demo wallet (SEED_WALLET) shows history
			// on first load.  Other wallets will see an empty list because their
			// address won't match any seed record.
			stakes: MOCK_STAKES,

			activeStakes: () =>
				walletStakes(get().stakes).filter((s) => s.status === "active"),
			pendingStakes: () =>
				walletStakes(get().stakes).filter(
					(s) => s.status === "pending_resolution",
				),
			completedStakes: () =>
				walletStakes(get().stakes).filter((s) => s.status === "completed"),

			placeStake: async (
				pollId,
				matchId,
				matchName,
				question,
				side,
				amount,
			) => {
				// Guard the money path directly: the modal's canSubmit check is the
				// only validation a caller has to bypass, and stale/future callers
				// must not be able to push a non-positive or non-finite amount.
				if (!Number.isFinite(amount) || amount <= 0) {
					throw new Error("Invalid stake amount");
				}

				const walletState = useWallet.getState();
				const address = walletState.address;

				// Calls the wallet's simulated Stellar transaction
				const receipt = await walletState.sendTransaction(
					amount,
					`Staked $${amount} on "${question}" – ${side.toUpperCase()}`,
				);

				// Update the poll pool in mock data store, passing the wallet
				// address so participants counts distinct wallets only
				const walletAddress = address || undefined;
				useMockData.getState().updatePollPool(pollId, side, amount, walletAddress);

				const stake: Stake = {
					id: `stake-${receipt.hash.slice(0, 8)}`,
					pollId,
					matchId,
					matchName,
					question,
					side,
					amount,
					status: "active",
					// Scope the stake to the wallet that placed it
					wallet: address,
				};

				set((s) => ({ stakes: [...s.stakes, stake].slice(-MAX_STAKES) }));

				// Analytics — no wallet address or seeds
				const poll = useMockData.getState().getPoll(pollId);
				trackEvent({
					name: "stake_placed",
					pollCategory: poll?.category ?? "other",
					matchId,
					side,
					amountUSD: amount,
				});

				return { stake, receipt };
			},

			calculateWinnings: (amount, side, yesPool, noPool) =>
				calculatePotentialWinnings(amount, side, yesPool, noPool),

			claimStake: async (stakeId: string) => {
				// Resolve through the wallet-scoped accessor: every other read path
				// filters by wallet first, and the unscoped array would let a stake
				// id belonging to a different account be claimed by this one.
				const stake = walletStakes(get().stakes).find((s) => s.id === stakeId);
				if (!stake) throw new Error("Stake not found");
				if (stake.status !== "completed") throw new Error("Stake is not completed");
				if (stake.outcome !== "won") throw new Error("Stake was not won");
				if (stake.claimed) throw new Error("Winnings already claimed");

				const grossPayout = calculateGrossPayout(
					stake.amount,
					stake.profit,
					stake.grossPayout,
				);

				const payout = calculateCompletedPayout(stake.amount, grossPayout);
				const netPayout = payout.net;
				// Convert USD net payout to XLM for wallet credit (balance is in XLM)
				const netPayoutXLM = netPayout / XLM_USD_RATE;

				// Credit wallet balance
				useWallet.getState().updateBalance(netPayoutXLM);

				// Record claim transaction in history
				useTransactions.getState().addTransaction({
					type: "claim",
					amount: netPayout,
					amountXLM: netPayoutXLM,
					description: `Claimed winnings from "${stake.question}" — NET $${netPayout.toFixed(2)} (gross $${grossPayout.toFixed(2)} − 5% fee)`,
					timestamp: new Date().toISOString(),
					status: "confirmed",
				});

				// Mark stake as claimed so it cannot be claimed again
				set((s) => ({
					stakes: s.stakes.map((st) =>
						st.id === stakeId ? { ...st, claimed: true } : st,
					),
				}));

				return { netPayout, netPayoutXLM };
			},

			clearWalletStakes: (address: string) =>
				set((s) => ({
					stakes: s.stakes.filter((stake) => stake.wallet !== address),
				})),
		}),
		{
		  name: STORAGE_KEYS.stakes,
		  version: 1,
		  migrate: (persistedState: unknown) => {
		    const stored = persistedState as { stakes?: unknown } | undefined;
		    const seededById = new Map(MOCK_STAKES.map((stake) => [stake.id, stake]));
		    const stakes = Array.isArray(stored?.stakes)
		      ? stored.stakes.flatMap((value) => {
		          if (!value || typeof value !== "object" || !("id" in value)) return [];
		          const stake = { ...seededById.get(String(value.id)), ...value };
		          return typeof stake.pollId === "string" &&
		            typeof stake.matchId === "string" &&
		            typeof stake.amount === "number"
		            ? [stake as Stake]
		            : [];
		        })
		      : MOCK_STAKES;
		    return { stakes };
		  },
		  /**
		   * Only persist the raw stakes array — computed selectors (activeStakes,
		   * pendingStakes, completedStakes) are re-derived on every access so they
		   * never need to be serialised.
		   */
		  partialize: (state) => ({ stakes: state.stakes }),
		  /**
		   * Wrap every setItem call so a QuotaExceededError degrades to memory-only
		   * instead of propagating through the action and leaving the in-memory
		   * state out of sync with what was persisted.
		   */
		  storage: {
		    getItem: (name) => {
		      const value = localStorage.getItem(name);
		      return value ? JSON.parse(value) : null;
		    },
		    setItem: (name, value) => {
		      try {
		        localStorage.setItem(name, JSON.stringify(value));
		      } catch (err) {
		        if (
		          err instanceof DOMException &&
		          (err.name === "QuotaExceededError" ||
		            err.name === "NS_ERROR_DOM_QUOTA_REACHED")
		        ) {
		          // Storage is full — in-memory state is still correct, so we
		          // swallow the error rather than surfacing a confusing throw.
		          if (process.env.NODE_ENV !== "production") {
		            console.warn("[use-staking] localStorage quota exceeded — stake persisted in memory only.");
		          }
		        } else {
		          throw err;
		        }
		      }
		    },
		    removeItem: (name) => localStorage.removeItem(name),
		  },
		},
	),
);
