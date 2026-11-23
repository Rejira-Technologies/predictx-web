/**
 * __tests__/use-staking.test.ts
 *
 * Unit tests for the financial paths in hooks/use-staking.ts:
 *   - placeStake: pool mutation, stake record creation
 *   - claimStake: gross-payout derivation, fee deduction, wallet credit
 *
 * The Zustand stores that use-staking depends on (use-wallet, use-mock-data,
 * use-transactions) are mocked at the module level so tests stay pure and fast.
 *
 * Closes #277
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoist mock references so vi.mock factories can close over them ──────────
const { mockSendTransaction, mockUpdateBalance, mockGetWalletState } =
  vi.hoisted(() => ({
    mockSendTransaction: vi.fn(),
    mockUpdateBalance: vi.fn(),
    mockGetWalletState: vi.fn(),
  }));

const { mockAddTransaction, mockGetTransactionsState } = vi.hoisted(() => ({
  mockAddTransaction: vi.fn(),
  mockGetTransactionsState: vi.fn(),
}));

const { mockTrackEvent } = vi.hoisted(() => ({ mockTrackEvent: vi.fn() }));

// ── Mock external dependencies ────────────────────────────────────────────────

vi.mock("@/lib/analytics", () => ({ trackEvent: mockTrackEvent }));

vi.mock("@/hooks/use-wallet", () => ({
  useWallet: {
    getState: mockGetWalletState,
  },
}));

// NOTE: @/hooks/use-mock-data is intentionally NOT mocked — placeStake must
// run against the real store so pool totals, stakeCount and the distinct-
// staker participant count are actually exercised (#480).

vi.mock("@/hooks/use-transactions", () => ({
  useTransactions: {
    getState: mockGetTransactionsState,
  },
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import { useStaking } from "@/hooks/use-staking";
import { useMockData } from "@/hooks/use-mock-data";
import { calculateCompletedPayout } from "@/lib/calculations";
import { XLM_USD_RATE } from "@/lib/constants";
import type { Poll } from "@/lib/mock-data";

// ── Test helpers ─────────────────────────────────────────────────────────────

const TEST_ADDRESS = "GTEST1234567890ABCDEF";

/** Reset the staking store to a clean slate before each test. */
function resetStore() {
  useStaking.setState({ stakes: [] });
}

/** Default mock implementations for a connected wallet. */
function setupWalletMocks(opts: { address?: string; balance?: number } = {}) {
  const address = opts.address ?? TEST_ADDRESS;
  const state = {
    address,
    balance: opts.balance ?? 1000,
    sendTransaction: mockSendTransaction,
    updateBalance: mockUpdateBalance,
  };
  mockGetWalletState.mockReturnValue(state);
}

const TEST_POLL: Poll = {
  id: "poll-1",
  matchId: "match-1",
  question: "Will Team A win?",
  category: "team_event",
  yesPool: 100,
  noPool: 100,
  participants: 0,
  stakeCount: 0,
  stakers: [],
  status: "active",
  lockTime: "kickoff",
  recentActivity: "No activity yet",
  createdAt: new Date().toISOString(),
};

/** Reset the real mock-data store to a single known poll before each test. */
function resetMockDataStore() {
  useMockData.setState({ polls: [{ ...TEST_POLL }], matches: [] });
}

function setupTransactionMocks() {
  mockGetTransactionsState.mockReturnValue({
    addTransaction: mockAddTransaction,
  });
}

// ── placeStake ────────────────────────────────────────────────────────────────

describe("useStaking.placeStake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    setupWalletMocks();
    resetMockDataStore();
    setupTransactionMocks();
  });

  it("adds a new stake to the store after a successful transaction", async () => {
    mockSendTransaction.mockResolvedValue({ hash: "abcdef1234567890" });

    await useStaking
      .getState()
      .placeStake("poll-1", "match-1", "Team A vs Team B", "Will Team A win?", "yes", 50);

    const stakes = useStaking.getState().stakes;
    expect(stakes).toHaveLength(1);
    expect(stakes[0]).toMatchObject({
      pollId: "poll-1",
      matchId: "match-1",
      question: "Will Team A win?",
      side: "yes",
      amount: 50,
      status: "active",
      wallet: TEST_ADDRESS,
    });
  });

  it("uses the transaction hash prefix as stake id", async () => {
    mockSendTransaction.mockResolvedValue({ hash: "hash9876543210abcd" });

    await useStaking
      .getState()
      .placeStake("poll-1", "match-1", "Team A vs Team B", "Will Team A win?", "yes", 50);

    const stake = useStaking.getState().stakes[0];
    expect(stake.id).toBe("stake-hash9876");
  });

  it("updates the real poll pool, stakeCount and stakers on a NO stake", async () => {
    mockSendTransaction.mockResolvedValue({ hash: "txhash000" });

    await useStaking
      .getState()
      .placeStake("poll-1", "match-1", "Match", "Question?", "no", 75);

    const poll = useMockData.getState().getPoll("poll-1");
    expect(poll?.yesPool).toBe(100); // untouched
    expect(poll?.noPool).toBe(175); // 100 + 75
    expect(poll?.stakeCount).toBe(1);
    expect(poll?.stakers).toEqual([TEST_ADDRESS]);
  });

  it("counts participants as distinct wallets, not stake count", async () => {
    mockSendTransaction.mockResolvedValue({ hash: "txhash000" });

    // Two stakes from the same wallet: stakeCount grows, participants does not.
    await useStaking
      .getState()
      .placeStake("poll-1", "match-1", "Match", "Question?", "yes", 10);
    await useStaking
      .getState()
      .placeStake("poll-1", "match-1", "Match", "Question?", "yes", 20);

    let poll = useMockData.getState().getPoll("poll-1");
    expect(poll?.stakeCount).toBe(2);
    expect(poll?.yesPool).toBe(130);
    expect(poll?.participants).toBe(1);
    expect(poll?.stakers).toEqual([TEST_ADDRESS]);

    // A stake from a different wallet adds a participant.
    setupWalletMocks({ address: "GOTHERWALLET000000000000" });
    await useStaking
      .getState()
      .placeStake("poll-1", "match-1", "Match", "Question?", "no", 5);

    poll = useMockData.getState().getPoll("poll-1");
    expect(poll?.stakeCount).toBe(3);
    expect(poll?.noPool).toBe(105);
    expect(poll?.participants).toBe(2);
    expect(poll?.stakers).toHaveLength(2);
  });

  it("returns the created stake and the transaction receipt", async () => {
    const receipt = { hash: "receiptHash12345678" };
    mockSendTransaction.mockResolvedValue(receipt);

    const result = await useStaking
      .getState()
      .placeStake("poll-1", "match-1", "Match", "Question?", "yes", 30);

    expect(result.receipt).toBe(receipt);
    expect(result.stake.amount).toBe(30);
  });

  it("fires a stake_placed analytics event", async () => {
    mockSendTransaction.mockResolvedValue({ hash: "analyticshash1234" });

    await useStaking
      .getState()
      .placeStake("poll-1", "match-1", "Match", "Question?", "yes", 10);

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ name: "stake_placed", matchId: "match-1", side: "yes" }),
    );
  });

  it("does not mutate the store when sendTransaction rejects", async () => {
    mockSendTransaction.mockRejectedValue(new Error("Insufficient funds"));

    await expect(
      useStaking
        .getState()
        .placeStake("poll-1", "match-1", "Match", "Question?", "yes", 999),
    ).rejects.toThrow("Insufficient funds");

    expect(useStaking.getState().stakes).toHaveLength(0);
  });
});

// ── claimStake ────────────────────────────────────────────────────────────────

describe("useStaking.claimStake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    setupWalletMocks();
    setupTransactionMocks();
  });

  /** Seed a single completed/won stake into the store. */
  function seedWonStake(overrides: Partial<{
    grossPayout: number;
    profit: number;
    claimed: boolean;
    status: string;
    outcome: string;
  }> = {}) {
    const stake = {
      id: "stake-won-001",
      pollId: "poll-1",
      matchId: "match-1",
      matchName: "Team A vs Team B",
      question: "Will Team A win?",
      side: "yes" as const,
      amount: 100,
      status: (overrides.status ?? "completed") as "active" | "completed" | "pending_resolution",
      outcome: (overrides.outcome ?? "won") as "won" | "lost" | undefined,
      wallet: TEST_ADDRESS,
      claimed: overrides.claimed ?? false,
      grossPayout: overrides.grossPayout,
      profit: overrides.profit,
    };
    useStaking.setState({ stakes: [stake] });
    return stake;
  }

  it("deducts 5% platform fee and credits net amount to wallet", async () => {
    seedWonStake({ grossPayout: 200 });

    const result = await useStaking.getState().claimStake("stake-won-001");

    // calculateCompletedPayout(100, 200) → net = 190
    const expected = calculateCompletedPayout(100, 200);
    expect(result.netPayout).toBeCloseTo(expected.net, 4);
    expect(mockUpdateBalance).toHaveBeenCalledWith(
      expect.closeTo(expected.net / XLM_USD_RATE, 4),
    );
  });

  it("converts USD net payout to XLM using XLM_USD_RATE", async () => {
    seedWonStake({ grossPayout: 150 });

    const result = await useStaking.getState().claimStake("stake-won-001");

    const expected = calculateCompletedPayout(100, 150);
    expect(result.netPayoutXLM).toBeCloseTo(expected.net / XLM_USD_RATE, 4);
  });

  it("derives grossPayout from profit when grossPayout is not stored", async () => {
    // profit is post-fee; gross = stake + profit/(1-0.05)
    seedWonStake({ profit: 90 }); // implies gross ≈ 100 + 90/0.95 = 194.74

    const result = await useStaking.getState().claimStake("stake-won-001");

    expect(result.netPayout).toBeGreaterThan(0);
    expect(mockUpdateBalance).toHaveBeenCalled();
  });

  it("falls back to stake amount as gross when neither grossPayout nor profit is set", async () => {
    seedWonStake({}); // no grossPayout, no profit → gross = amount = 100

    const result = await useStaking.getState().claimStake("stake-won-001");

    // calculateCompletedPayout(100, 100) → net = 95
    const expected = calculateCompletedPayout(100, 100);
    expect(result.netPayout).toBeCloseTo(expected.net, 4);
  });

  it("marks the stake as claimed after a successful claim", async () => {
    seedWonStake({ grossPayout: 200 });

    await useStaking.getState().claimStake("stake-won-001");

    const stake = useStaking.getState().stakes.find((s) => s.id === "stake-won-001");
    expect(stake?.claimed).toBe(true);
  });

  it("records a claim transaction in the ledger", async () => {
    seedWonStake({ grossPayout: 200 });

    await useStaking.getState().claimStake("stake-won-001");

    expect(mockAddTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "claim", status: "confirmed" }),
    );
  });

  it("throws if the stake does not exist", async () => {
    await expect(
      useStaking.getState().claimStake("non-existent"),
    ).rejects.toThrow("Stake not found");
  });

  it("throws if the stake is not completed", async () => {
    seedWonStake({ status: "active", outcome: "won" });

    await expect(
      useStaking.getState().claimStake("stake-won-001"),
    ).rejects.toThrow("Stake is not completed");
  });

  it("throws if the stake outcome is not won", async () => {
    seedWonStake({ outcome: "lost" });

    await expect(
      useStaking.getState().claimStake("stake-won-001"),
    ).rejects.toThrow("Stake was not won");
  });

  it("throws if the stake has already been claimed", async () => {
    seedWonStake({ claimed: true, grossPayout: 200 });

    await expect(
      useStaking.getState().claimStake("stake-won-001"),
    ).rejects.toThrow("Winnings already claimed");
  });
});
