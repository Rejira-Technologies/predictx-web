"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_STAKES, STORAGE_KEYS, type Stake } from "@/lib/mock-data";
import {
  calculatePotentialWinnings,
  type WinningsCalculation,
} from "@/lib/calculations";
import { useMockData } from "@/hooks/use-mock-data";
import { useWallet, type TransactionReceipt } from "@/hooks/use-wallet";
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

// ── Store ──────────────────────────────────────────────────────────────────

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

			clearWalletStakes: (address: string) =>
				set((s) => ({
					stakes: s.stakes.filter((stake) => stake.wallet !== address),
				})),
		}),
		{ name: STORAGE_KEYS.stakes },
	),
);
