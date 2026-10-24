import { describe, it, expect } from "vitest";
import {
  xlmToStroops,
  stroopsToXlm,
  pollToScVal,
  stakeToScVal,
  scValToPoll,
  scValToStake,
  STROOPS_PER_XLM,
} from "@/lib/soroban-types";
import {
  getPolls,
  getPollById,
  getUserStakes,
  getPlatformStats,
  createPoll,
  placeBet,
  castVote,
  claimWinnings,
  StellarError,
  USE_MOCK,
} from "@/lib/contract";
import { nativeToScVal } from "@stellar/stellar-sdk";

describe("lib/soroban-types", () => {
  it("converts XLM to stroops correctly", () => {
    expect(STROOPS_PER_XLM).toBe(10_000_000);
    expect(xlmToStroops(1)).toBe(10_000_000n);
    expect(xlmToStroops(0.5)).toBe(5_000_000n);
    expect(xlmToStroops(100)).toBe(1_000_000_000n);
  });

  it("converts stroops to XLM correctly", () => {
    expect(stroopsToXlm(10_000_000n)).toBe(1);
    expect(stroopsToXlm(5_000_000n)).toBe(0.5);
    expect(stroopsToXlm(10_000_000)).toBe(1);
  });

  it("converts stakeToScVal", () => {
    const scVal = stakeToScVal(10);
    expect(scVal).toBeDefined();
  });

  it("converts pollToScVal", () => {
    const scVal = pollToScVal({
      matchId: "m1",
      question: "Will Arsenal win?",
      options: ["yes", "no"],
      stakeAmount: 50,
    });
    expect(scVal).toBeDefined();
  });

  it("converts scVal to Poll and Stake", () => {
    const pollScVal = nativeToScVal({
      id: "poll-101",
      match_id: "m1",
      question: "Will test pass?",
      yes_pool: 10_000_000,
      no_pool: 20_000_000,
      category: "team-event",
      status: "active",
    });
    const domainPoll = scValToPoll(pollScVal);
    expect(domainPoll.id).toBe("poll-101");
    expect(domainPoll.yesPool).toBe(1);
    expect(domainPoll.noPool).toBe(2);
    expect(domainPoll.totalPool).toBe(3);

    const stakeScVal = nativeToScVal({
      id: "stake-202",
      poll_id: "poll-101",
      match_id: "m1",
      user_id: "GDKXJNLE2YQFPQZ5TK3VZRKPTMJ4OLR3QB7IU6FSCZ6KQF7H4V29F3H",
      side: "yes",
      amount: 50_000_000,
      status: "active",
    });
    const domainStake = scValToStake(stakeScVal);
    expect(domainStake.id).toBe("stake-202");
    expect(domainStake.amount).toBe(5);
    expect(domainStake.side).toBe("yes");
  });
});

describe("lib/contract", () => {
  it("exports StellarError with expected codes", () => {
    const err = new StellarError("User rejected tx", "USER_REJECTED");
    expect(err.name).toBe("StellarError");
    expect(err.code).toBe("USER_REJECTED");
    expect(err.message).toBe("User rejected tx");
  });

  it("exposes USE_MOCK toggle", () => {
    expect(typeof USE_MOCK).toBe("boolean");
  });

  it("fetches polls in mock mode", async () => {
    const polls = await getPolls();
    expect(Array.isArray(polls)).toBe(true);
    expect(polls.length).toBeGreaterThan(0);
    expect(polls[0]).toHaveProperty("id");
    expect(polls[0]).toHaveProperty("question");
    expect(polls[0]).toHaveProperty("yesPool");
  });

  it("fetches poll by ID in mock mode", async () => {
    const poll = await getPollById("m1-p1");
    expect(poll).not.toBeNull();
    expect(poll?.id).toBe("m1-p1");

    const nonExistent = await getPollById("non-existent-id");
    expect(nonExistent).toBeNull();
  });

  it("fetches user stakes in mock mode", async () => {
    const stakes = await getUserStakes("GDKXJNLE2YQFPQZ5TK3VZRKPTMJ4OLR3QB7IU6FSCZ6KQF7H4V29F3H");
    expect(Array.isArray(stakes)).toBe(true);
    expect(stakes.length).toBeGreaterThan(0);
  });

  it("fetches platform stats in mock mode", async () => {
    const stats = await getPlatformStats();
    expect(stats).toHaveProperty("totalValueLocked");
    expect(stats).toHaveProperty("activePredictions");
    expect(stats).toHaveProperty("communityMembers");
  });

  it("handles write operations in mock mode without throwing", async () => {
    const resCreate = await createPoll(
      "GDKXJNLE2YQFPQZ5TK3VZRKPTMJ4OLR3QB7IU6FSCZ6KQF7H4V29F3H",
      "m1",
      "Will test succeed?",
      ["yes", "no"],
      10,
    );
    expect(resCreate.status).toBe("SUCCESS");

    const resBet = await placeBet(
      "GDKXJNLE2YQFPQZ5TK3VZRKPTMJ4OLR3QB7IU6FSCZ6KQF7H4V29F3H",
      "m1-p1",
      0,
      25,
    );
    expect(resBet.status).toBe("SUCCESS");

    const resVote = await castVote(
      "GDKXJNLE2YQFPQZ5TK3VZRKPTMJ4OLR3QB7IU6FSCZ6KQF7H4V29F3H",
      "m1-p1",
      0,
    );
    expect(resVote.status).toBe("SUCCESS");

    const resClaim = await claimWinnings(
      "GDKXJNLE2YQFPQZ5TK3VZRKPTMJ4OLR3QB7IU6FSCZ6KQF7H4V29F3H",
      "m1-p1",
    );
    expect(resClaim.status).toBe("SUCCESS");
  });
});
