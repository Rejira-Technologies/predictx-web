/**
 * __tests__/use-voting.test.ts
 *
 * Unit tests for the financial path in hooks/use-voting.ts:
 *   - settleRewards: reward crediting, outcome matching, unclear exclusion,
 *     wallet credit, transaction ledger entry, idempotency.
 *
 * Closes #277
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoist mock references ─────────────────────────────────────────────────────
const { mockUpdateBalance, mockGetWalletState } = vi.hoisted(() => ({
  mockUpdateBalance: vi.fn(),
  mockGetWalletState: vi.fn(),
}));

const { mockAddTransaction, mockGetTransactionsState } = vi.hoisted(() => ({
  mockAddTransaction: vi.fn(),
  mockGetTransactionsState: vi.fn(),
}));

const { mockGetMockDataState } = vi.hoisted(() => ({
  mockGetMockDataState: vi.fn(),
}));

const { mockTrackEvent } = vi.hoisted(() => ({ mockTrackEvent: vi.fn() }));

// ── Mock dependencies ─────────────────────────────────────────────────────────

vi.mock("@/lib/analytics", () => ({ trackEvent: mockTrackEvent }));

vi.mock("@/hooks/use-wallet", () => ({
  useWallet: { getState: mockGetWalletState },
}));

vi.mock("@/hooks/use-transactions", () => ({
  useTransactions: { getState: mockGetTransactionsState },
}));

vi.mock("@/hooks/use-mock-data", () => ({
  useMockData: { getState: mockGetMockDataState },
}));

// use-voting also creates a useStaking reference, mock it out
vi.mock("@/hooks/use-staking", () => ({
  useStaking: {
    getState: vi.fn(() => ({ stakes: [] })),
  },
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import { useVoting } from "@/hooks/use-voting";
import { XLM_USD_RATE } from "@/lib/constants";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TEST_ADDRESS = "GVOTING_TEST_ADDRESS";

type PollOutcome = "yes" | "no";

interface MockPoll {
  id: string;
  matchId: string;
  status: string;
  outcome?: PollOutcome;
  yesPool: number;
  noPool: number;
  question: string;
  category: string;
  lockTime: "kickoff";
}

function resetStore() {
  useVoting.setState({
    allVotes: {},
    pendingRewards: {},
    userEarnings: 0,
    unclearVotesByPoll: {},
    communityVotes: {},
  });
}

function setupWalletMocks(address: string = TEST_ADDRESS) {
  mockGetWalletState.mockReturnValue({
    address,
    updateBalance: mockUpdateBalance,
  });
}

function setupTransactionMocks() {
  mockGetTransactionsState.mockReturnValue({ addTransaction: mockAddTransaction });
}

function setupMockDataWithPolls(polls: MockPoll[]) {
  mockGetMockDataState.mockReturnValue({
    polls,
    getPoll: (id: string) => polls.find((p) => p.id === id),
    getMatch: vi.fn(() => ({ kickoff: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() })),
    updatePollPool: vi.fn(),
  });
}

/** Seed a pending reward for the test wallet. */
function seedPendingReward(
  pollId: string,
  decision: "yes" | "no" | "unclear",
  amount: number,
) {
  useVoting.setState((s) => ({
    pendingRewards: {
      ...s.pendingRewards,
      [TEST_ADDRESS]: {
        ...(s.pendingRewards[TEST_ADDRESS] ?? {}),
        [pollId]: {
          pollId,
          matchName: "Team A vs Team B",
          question: "Will Team A win?",
          amount,
          decision,
        },
      },
    },
  }));
}

// ── settleRewards ─────────────────────────────────────────────────────────────

describe("useVoting.settleRewards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    setupWalletMocks();
    setupTransactionMocks();
  });

  it("credits wallet balance when vote matches resolved outcome", () => {
    const poll: MockPoll = {
      id: "poll-yes-resolved",
      matchId: "match-1",
      status: "resolved",
      outcome: "yes",
      yesPool: 200,
      noPool: 100,
      question: "Will Team A win?",
      category: "team_event",
      lockTime: "kickoff",
    };
    setupMockDataWithPolls([poll]);
    seedPendingReward("poll-yes-resolved", "yes", 5);

    useVoting.getState().settleRewards();

    expect(mockUpdateBalance).toHaveBeenCalledWith(
      expect.closeTo(5 / XLM_USD_RATE, 4),
    );
  });

  it("increments userEarnings by the reward amount", () => {
    const poll: MockPoll = {
      id: "poll-earn",
      matchId: "match-2",
      status: "resolved",
      outcome: "no",
      yesPool: 100,
      noPool: 200,
      question: "Will there be a red card?",
      category: "player_event",
      lockTime: "kickoff",
    };
    setupMockDataWithPolls([poll]);
    seedPendingReward("poll-earn", "no", 3.5);

    useVoting.getState().settleRewards();

    expect(useVoting.getState().userEarnings).toBeCloseTo(3.5, 4);
  });

  it("does NOT credit wallet when vote does not match outcome", () => {
    const poll: MockPoll = {
      id: "poll-wrong",
      matchId: "match-3",
      status: "resolved",
      outcome: "yes",
      yesPool: 100,
      noPool: 200,
      question: "Over 2.5 goals?",
      category: "score_prediction",
      lockTime: "kickoff",
    };
    setupMockDataWithPolls([poll]);
    seedPendingReward("poll-wrong", "no", 4); // voted no, outcome was yes

    useVoting.getState().settleRewards();

    expect(mockUpdateBalance).not.toHaveBeenCalled();
    expect(useVoting.getState().userEarnings).toBe(0);
  });

  it("does NOT credit wallet for unclear votes", () => {
    const poll: MockPoll = {
      id: "poll-unclear",
      matchId: "match-4",
      status: "resolved",
      outcome: "yes",
      yesPool: 100,
      noPool: 50,
      question: "Will there be a VAR review?",
      category: "other",
      lockTime: "kickoff",
    };
    setupMockDataWithPolls([poll]);
    seedPendingReward("poll-unclear", "unclear", 2);

    useVoting.getState().settleRewards();

    expect(mockUpdateBalance).not.toHaveBeenCalled();
  });

  it("removes settled poll from pendingRewards regardless of outcome", () => {
    const poll: MockPoll = {
      id: "poll-remove",
      matchId: "match-5",
      status: "resolved",
      outcome: "yes",
      yesPool: 100,
      noPool: 100,
      question: "Test question",
      category: "other",
      lockTime: "kickoff",
    };
    setupMockDataWithPolls([poll]);
    seedPendingReward("poll-remove", "no", 1); // wrong vote

    useVoting.getState().settleRewards();

    const remaining = useVoting.getState().pendingRewards[TEST_ADDRESS] ?? {};
    expect(remaining).not.toHaveProperty("poll-remove");
  });

  it("does NOT settle polls that are not yet resolved", () => {
    const poll: MockPoll = {
      id: "poll-voting",
      matchId: "match-6",
      status: "voting", // not resolved yet
      outcome: undefined,
      yesPool: 100,
      noPool: 100,
      question: "Test question",
      category: "other",
      lockTime: "kickoff",
    };
    setupMockDataWithPolls([poll]);
    seedPendingReward("poll-voting", "yes", 2);

    useVoting.getState().settleRewards();

    expect(mockUpdateBalance).not.toHaveBeenCalled();
    // Pending reward should still be there
    const remaining = useVoting.getState().pendingRewards[TEST_ADDRESS] ?? {};
    expect(remaining).toHaveProperty("poll-voting");
  });

  it("settles multiple polls in a single call", () => {
    const polls: MockPoll[] = [
      {
        id: "poll-a",
        matchId: "match-7",
        status: "resolved",
        outcome: "yes",
        yesPool: 100,
        noPool: 50,
        question: "Q1",
        category: "other",
        lockTime: "kickoff",
      },
      {
        id: "poll-b",
        matchId: "match-8",
        status: "resolved",
        outcome: "no",
        yesPool: 50,
        noPool: 100,
        question: "Q2",
        category: "other",
        lockTime: "kickoff",
      },
    ];
    setupMockDataWithPolls(polls);
    seedPendingReward("poll-a", "yes", 3); // correct
    seedPendingReward("poll-b", "no", 4);  // correct

    useVoting.getState().settleRewards();

    expect(mockUpdateBalance).toHaveBeenCalledTimes(2);
    expect(useVoting.getState().userEarnings).toBeCloseTo(7, 4);
  });

  it("writes a vote_reward transaction entry for each credited reward", () => {
    const poll: MockPoll = {
      id: "poll-tx",
      matchId: "match-9",
      status: "resolved",
      outcome: "yes",
      yesPool: 100,
      noPool: 50,
      question: "Will the home team score first?",
      category: "team_event",
      lockTime: "kickoff",
    };
    setupMockDataWithPolls([poll]);
    seedPendingReward("poll-tx", "yes", 5);

    useVoting.getState().settleRewards();

    expect(mockAddTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "vote_reward", status: "confirmed" }),
    );
  });

  it("is idempotent — calling twice does not double-credit", () => {
    const poll: MockPoll = {
      id: "poll-idem",
      matchId: "match-10",
      status: "resolved",
      outcome: "yes",
      yesPool: 100,
      noPool: 50,
      question: "Q",
      category: "other",
      lockTime: "kickoff",
    };
    setupMockDataWithPolls([poll]);
    seedPendingReward("poll-idem", "yes", 6);

    useVoting.getState().settleRewards();
    useVoting.getState().settleRewards(); // second call — no pending rewards left

    expect(mockUpdateBalance).toHaveBeenCalledTimes(1);
    expect(useVoting.getState().userEarnings).toBeCloseTo(6, 4);
  });

  it("is a no-op when no wallet is connected", () => {
    mockGetWalletState.mockReturnValue({ address: null, updateBalance: mockUpdateBalance });

    useVoting.getState().settleRewards();

    expect(mockUpdateBalance).not.toHaveBeenCalled();
  });

  it("discards pending rewards for polls that no longer exist", () => {
    setupMockDataWithPolls([]); // poll-ghost doesn't exist in mock data
    seedPendingReward("poll-ghost", "yes", 3);

    useVoting.getState().settleRewards();

    expect(mockUpdateBalance).not.toHaveBeenCalled();
    const remaining = useVoting.getState().pendingRewards[TEST_ADDRESS] ?? {};
    expect(remaining).not.toHaveProperty("poll-ghost");
  });
});
