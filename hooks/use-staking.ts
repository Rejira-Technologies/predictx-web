"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_STAKES, STORAGE_KEYS, type Stake } from "@/lib/mock-data";
import {
	calculatePotentialWinnings,
	calculateCompletedPayout,
	type WinningsCalculation,
} from "@/lib/calculations";
import { XLM_USD_RATE } from "@/lib/constants";
import { useMockData } from "@/hooks/use-mock-data";
import { useWallet, type TransactionReceipt } from "@/hooks/use-wallet";
import { useTransactions } from "@/hooks/use-transactions";
import { trackEvent } from "@/lib/analytics";

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
				const walletState = useWallet.getState();

				// Calls the wallet's simulated Stellar transaction
				const receipt = await walletState.sendTransaction(
					amount,
					`Staked $${amount} on "${question}" – ${side.toUpperCase()}`,
				);

				// Update the poll pool in mock data store, passing the wallet
				// address so participants counts distinct wallets only
				const walletAddress = useWallet.getState().address ?? undefined;
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
					wallet: walletState.address,
				};

				set((s) => ({ stakes: [...s.stakes, stake] }));

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
				const stake = get().stakes.find((s) => s.id === stakeId);
				if (!stake) throw new Error("Stake not found");
				if (stake.status !== "completed") throw new Error("Stake is not completed");
				if (stake.outcome !== "won") throw new Error("Stake was not won");
				if (stake.claimed) throw new Error("Winnings already claimed");

				// Determine gross payout: use stored grossPayout or derive from profit
				const grossPayout =
					stake.grossPayout ??
					(stake.profit != null
						? stake.amount + stake.profit / (1 - 0.05)
						: stake.amount);

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
		{ name: STORAGE_KEYS.stakes },
	),
);
