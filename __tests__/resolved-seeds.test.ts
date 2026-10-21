import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PollCard } from "@/components/poll-card";
import { CompletedPredictions } from "@/components/completed-predictions";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/shared", () => ({
  GamingButton: ({ children }: { children?: ReactNode }) => children,
  TeamBadge: () => null,
}));
vi.mock("@/components/staking", () => ({ StakeModal: () => null }));
import {
  MATCHES,
  MATCH_EVIDENCE,
  MOCK_STAKES,
  MOCK_USER,
  MOCK_VOTING_OPPORTUNITIES,
  POLLS,
  STORAGE_KEYS,
  type Poll,
  type Stake,
} from "@/lib/mock-data";
import { calculateCompletedPayout, isPollLocked } from "@/lib/calculations";
import { XLM_USD_RATE } from "@/lib/constants";
import { useMockData } from "@/hooks/use-mock-data";
import { useStaking } from "@/hooks/use-staking";
import { useVoting } from "@/hooks/use-voting";
import { useWallet } from "@/hooks/use-wallet";
import { useTransactions } from "@/hooks/use-transactions";

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const completed = MOCK_STAKES.filter((stake) => stake.status === "completed");
const resolved = POLLS.filter((poll) => poll.status === "resolved");

function save(key: string, state: unknown) {
  localStorage.setItem(key, JSON.stringify({ state, version: 0 }));
}

beforeEach(() => {
  localStorage.clear();
  useMockData.setState({ matches: copy(MATCHES), polls: copy(POLLS), userCreatedPollCount: 0 });
  useStaking.setState({ stakes: copy(MOCK_STAKES) });
  useWallet.setState({ address: MOCK_USER.address, isConnected: true, balance: 0 });
  useTransactions.setState({ transactions: [] });
  useVoting.setState({ allVotes: {}, pendingRewards: {}, userEarnings: 0 });
});

afterEach(() => localStorage.clear());

describe("resolved seed consistency", () => {
  it("contains a historical completed match with every poll resolved and a definitive outcome", () => {
    expect(resolved.length).toBeGreaterThan(0);
    const match = MATCHES.find((candidate) => candidate.id === resolved[0].matchId)!;
    expect(match.status).toBe("completed");
    expect(new Date(match.kickoff).getTime()).toBeLessThan(Date.now() - 24 * 60 * 60 * 1000);
    const polls = POLLS.filter((poll) => poll.matchId === match.id);
    expect(polls.length).toBeGreaterThan(0);
    for (const poll of polls) {
      expect(poll.status).toBe("resolved");
      expect(["yes", "no"]).toContain(poll.outcome);
      expect(isPollLocked(poll, match)).toBe(true);
    }
    expect(new Set(polls.map((poll) => poll.outcome))).toEqual(new Set(["yes", "no"]));
  });

  it("keeps final score and match evidence consistent with the resolved outcomes", () => {
    const match = MATCHES.find((candidate) => candidate.id === "m7")!;
    const totalGoals = match.score!.home + match.score!.away;
    const expected: Record<string, "yes" | "no"> = {
      "Will Everton win?": match.score!.home > match.score!.away ? "yes" : "no",
      "Will Wolves win?": match.score!.away > match.score!.home ? "yes" : "no",
      "Will total goals be over 2.5?": totalGoals > 2.5 ? "yes" : "no",
      "Will total goals be under 2.5?": totalGoals < 2.5 ? "yes" : "no",
      "Will there be a red card?": "no",
      "Will there be a VAR review?": "yes",
    };
    for (const poll of resolved) expect(poll.outcome).toBe(expected[poll.question]);
    const evidence = MATCH_EVIDENCE[match.id];
    expect(evidence.matchId).toBe(match.id);
    expect(evidence.timeline.some((item) => item.event.includes("VAR Review"))).toBe(true);
    expect(evidence.timeline.at(-1)!.event).toContain("Everton 2 - 1 Wolves — No red cards");
  });

  it("maps all completed wins and losses to matching resolved polls and fee-adjusted payouts", () => {
    expect(completed.length).toBeGreaterThan(0);
    for (const stake of completed) {
      const poll = POLLS.find((candidate) => candidate.id === stake.pollId)!;
      const match = MATCHES.find((candidate) => candidate.id === stake.matchId)!;
      expect(poll).toBeDefined();
      expect(poll.matchId).toBe(match.id);
      expect(match.status).toBe("completed");
      expect(stake.matchName).toBe(`${match.homeTeam} vs ${match.awayTeam}`);
      expect(stake.question).toBe(poll.question);
      expect(poll.status).toBe("resolved");
      const won = stake.side === poll.outcome;
      expect(stake.outcome).toBe(won ? "won" : "lost");
      if (won) {
        const winningPool = stake.side === "yes" ? poll.yesPool : poll.noPool;
        const gross = stake.amount / winningPool * (poll.yesPool + poll.noPool);
        expect(stake.grossPayout).toBeCloseTo(gross);
        const payout = calculateCompletedPayout(stake.amount, gross);
        expect(stake.profit).toBe(payout.profit);
        expect(stake.roi).toBe(payout.roi);
      } else {
        expect(stake.profit).toBe(-stake.amount);
        expect(stake.roi).toBe(-100);
        expect(stake.grossPayout ?? 0).toBe(0);
        expect(stake.claimed ?? false).toBe(false);
      }
    }
    expect(completed.some((stake) => stake.outcome === "won" && stake.claimed)).toBe(true);
    expect(completed.some((stake) => stake.outcome === "won" && !stake.claimed)).toBe(true);
    expect(completed.some((stake) => stake.outcome === "lost")).toBe(true);
  });

  it("preserves active and pending examples, distinct IDs and available voting fixtures", () => {
    expect(new Set(MATCHES.map((match) => match.id)).size).toBe(MATCHES.length);
    expect(new Set(POLLS.map((poll) => poll.id)).size).toBe(POLLS.length);
    expect(new Set(MOCK_STAKES.map((stake) => stake.id)).size).toBe(MOCK_STAKES.length);
    for (const stake of MOCK_STAKES.filter((candidate) => candidate.status !== "completed")) {
      const poll = POLLS.find((candidate) => candidate.id === stake.pollId)!;
      expect(stake.matchId).toBe(poll.matchId);
      expect(stake.question).toBe(poll.question);
      expect(poll.status).toBe(stake.status === "active" ? "active" : "voting");
    }
    expect(MOCK_VOTING_OPPORTUNITIES.length).toBeGreaterThan(0);
    for (const opportunity of MOCK_VOTING_OPPORTUNITIES) {
      const poll = POLLS.find((candidate) => candidate.id === opportunity.pollId)!;
      expect(poll.status).toBe("voting");
      expect(opportunity.matchId).toBe(poll.matchId);
    }
  });
});

describe("seed rehydration", () => {
  it("adds missing resolved fixtures to an old snapshot without losing pools or custom polls", async () => {
    const oldPolls = copy(POLLS.filter((poll) => poll.matchId !== "m7"));
    oldPolls[0] = { ...oldPolls[0], yesPool: oldPolls[0].yesPool + 123, stakers: ["wallet-one"] };
    const custom: Poll = { ...copy(POLLS[0]), id: "custom-poll", status: "resolved", outcome: "no", participants: 0 };
    save(STORAGE_KEYS.pools, { polls: [custom, ...oldPolls], userCreatedPollCount: 1 });
    await useMockData.persist.rehydrate();
    const store = useMockData.getState();
    expect(store.getPoll(custom.id)).toEqual(custom);
    expect(store.getPoll(oldPolls[0].id)!.yesPool).toBe(POLLS[0].yesPool + 123);
    expect(store.getPoll(oldPolls[0].id)!.participants).toBe(POLLS[0].participants + 1);
    expect(store.userCreatedPollCount).toBe(1);
    for (const poll of resolved) expect(store.getPoll(poll.id)).toEqual(poll);
    expect(store.getMatch("m7")!.status).toBe("completed");
    await useMockData.persist.rehydrate();
    expect(new Set(useMockData.getState().polls.map((poll) => poll.id)).size).toBe(POLLS.length + 1);
  });

  it("keeps a persisted definitive resolution instead of returning it to voting", async () => {
    const voting = POLLS.find((poll) => poll.status === "voting")!;
    const persisted = { ...copy(voting), status: "resolved" as const, outcome: "no" as const, noPool: voting.noPool + 50 };
    save(STORAGE_KEYS.pools, { polls: [persisted], userCreatedPollCount: 0 });
    await useMockData.persist.rehydrate();
    expect(useMockData.getState().getPoll(voting.id)).toEqual(persisted);
  });

  it("refreshes seed resolution and outcome together while preserving pool deltas", async () => {
    const poll = resolved[0];
    save(STORAGE_KEYS.pools, { polls: [{ ...poll, status: "voting", outcome: undefined, yesPool: poll.yesPool + 50 }] });
    await useMockData.persist.rehydrate();
    expect(useMockData.getState().getPoll(poll.id)).toMatchObject({ status: "resolved", outcome: poll.outcome, yesPool: poll.yesPool + 50 });
  });

  it("repairs old demo stakes and retains claimed winnings, foreign wallets and removed entries", async () => {
    const unclaimed = completed.find((stake) => stake.outcome === "won" && !stake.claimed)!;
    const foreign: Stake = { ...copy(unclaimed), wallet: "another-wallet", pollId: "custom-poll" };
    const legacy = completed.map((stake) => ({ ...copy(stake), pollId: "m6-p1", matchId: "m6", claimed: stake.id === unclaimed.id }));
    save(STORAGE_KEYS.stakes, { stakes: [...legacy, foreign] });
    await useStaking.persist.rehydrate();
    const stakes = useStaking.getState().stakes;
    for (const seed of completed) {
      const actual = stakes.find((stake) => stake.id === seed.id && stake.wallet === seed.wallet)!;
      expect(actual.pollId).toBe(seed.pollId);
      expect(actual.matchId).toBe(seed.matchId);
      expect(actual.claimed ?? false).toBe(Boolean(seed.claimed || seed.id === unclaimed.id));
    }
    expect(stakes.at(-1)).toEqual(foreign);
    save(STORAGE_KEYS.stakes, { stakes: [foreign] });
    await useStaking.persist.rehydrate();
    expect(useStaking.getState().stakes).toEqual([foreign]);
  });
});

describe("resolved rewards and claims", () => {
  it("settles matching yes and no rewards once and retains unresolved rewards", () => {
    const yes = resolved.find((poll) => poll.outcome === "yes")!;
    const no = resolved.find((poll) => poll.outcome === "no")!;
    const wrong = resolved.find((poll) => poll.id !== yes.id && poll.outcome === "yes")!;
    const unclear = resolved.find((poll) => ![yes.id, no.id, wrong.id].includes(poll.id))!;
    const voting = POLLS.find((poll) => poll.status === "voting")!;
    const pending = (poll: Poll, decision: "yes" | "no" | "unclear", amount: number) => ({
      pollId: poll.id, matchName: "Everton vs Wolves", question: poll.question, decision, amount,
    });
    useVoting.setState({ pendingRewards: { [MOCK_USER.address]: {
      [yes.id]: pending(yes, "yes", 12),
      [no.id]: pending(no, "no", 8),
      [wrong.id]: pending(wrong, "no", 7),
      [unclear.id]: pending(unclear, "unclear", 9),
      [voting.id]: pending(voting, "yes", 5),
    } } });
    useVoting.getState().settleRewards();
    expect(useWallet.getState().balance).toBeCloseTo(20 / XLM_USD_RATE);
    expect(useVoting.getState().userEarnings).toBe(20);
    expect(Object.keys(useVoting.getState().pendingRewards[MOCK_USER.address])).toEqual([voting.id]);
    expect(useTransactions.getState().transactions.map((transaction) => transaction.type)).toEqual(["vote_reward", "vote_reward"]);
    useVoting.getState().settleRewards();
    expect(useWallet.getState().balance).toBeCloseTo(20 / XLM_USD_RATE);
    expect(useTransactions.getState().transactions).toHaveLength(2);
  });

  it("rejects claimed seeds, pays an eligible win once and retains its claim across reload", async () => {
    const claimed = completed.find((stake) => stake.outcome === "won" && stake.claimed)!;
    const unclaimed = completed.find((stake) => stake.outcome === "won" && !stake.claimed)!;
    await expect(useStaking.getState().claimStake(claimed.id)).rejects.toThrow("already claimed");
    expect(useWallet.getState().balance).toBe(0);
    const payout = calculateCompletedPayout(unclaimed.amount, unclaimed.grossPayout!);
    const receipt = await useStaking.getState().claimStake(unclaimed.id);
    expect(receipt.netPayout).toBe(payout.net);
    expect(useWallet.getState().balance).toBeCloseTo(payout.net / XLM_USD_RATE);
    expect(useTransactions.getState().transactions).toHaveLength(1);
    expect(useTransactions.getState().transactions[0]).toMatchObject({ type: "claim", amount: payout.net });
    await useStaking.persist.rehydrate();
    await expect(useStaking.getState().claimStake(unclaimed.id)).rejects.toThrow("already claimed");
    expect(useTransactions.getState().transactions).toHaveLength(1);
  });

  it("excludes resolved fixture polls from voting", () => {
    useMockData.setState({ polls: copy(resolved) });
    expect(useVoting.getState().availablePolls()).toEqual([]);
  });
});


describe("resolved fixture rendering", () => {
  it("renders the actual YES/NO outcomes instead of the closed-staking footer", () => {
    for (const poll of resolved) {
      const match = MATCHES.find((candidate) => candidate.id === poll.matchId)!;
      const html = renderToStaticMarkup(createElement(PollCard, { poll, match, variant: "detailed" }));
      expect(html).toContain(poll.outcome === "yes" ? "YES WON" : "NO WON");
      expect(html).not.toContain("Staking Closed");
      expect(html).not.toContain("Awaiting Resolution");
    }
  });

  it("renders both already claimed and claimable winning stakes on the demo dashboard", () => {
    const html = renderToStaticMarkup(createElement(CompletedPredictions));
    expect(html).toContain("Winnings Claimed");
    expect(html).toContain("Claim Winnings");
  });
});
