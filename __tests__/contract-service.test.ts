import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import type { MockInstance } from "vitest";
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
import { nativeToScVal, scValToNative } from "@stellar/stellar-sdk";
import type { Transaction } from "@stellar/stellar-sdk";

vi.mock("@/lib/stellar", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stellar")>();
  return {
    ...actual,
    sorobanServer: {
      getAccount: vi.fn(),
      simulateTransaction: vi.fn(),
      sendTransaction: vi.fn(),
      getTransaction: vi.fn(),
    },
  };
});

vi.mock("@stellar/freighter-api", () => ({
  signTransaction: vi.fn(async (xdr: string) => xdr),
}));

vi.mock("@stellar/stellar-sdk", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@stellar/stellar-sdk")>();
  return {
    ...actual,
    rpc: {
      ...actual.rpc,
      assembleTransaction: (tx: unknown) => ({ build: () => tx }),
    },
  };
});

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

describe("lib/contract live write path (mock mode off)", () => {
  const PUBKEY = "GD45LOLMFLO2S5RCJFLSPQTXTQUZIGPIWCJTCIGRPISUBPIYN6DY4S4V";
  const CONTRACT_ID =
    "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

  let liveContract: typeof import("@/lib/contract");
  let server: {
    getAccount: ReturnType<typeof vi.fn>;
    simulateTransaction: ReturnType<typeof vi.fn>;
    sendTransaction: ReturnType<typeof vi.fn>;
    getTransaction: ReturnType<typeof vi.fn>;
  };
  let callSpy: MockInstance;
  let toXdrSpy: MockInstance;
  let fromXdrSpy: MockInstance;

  function lastContractCall(): { method: string; args: unknown[] } {
    const calls = callSpy.mock.calls;
    const [method, ...args] = calls[calls.length - 1] as [string, ...unknown[]];
    return {
      method,
      args: (args as { toJSON?: () => unknown }[]).map((a) =>
        // ScVal arguments are decoded back to native values for assertions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (scValToNative as any)(a),
      ),
    };
  }

  beforeAll(async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_DATA", "false");
    vi.stubEnv("NEXT_PUBLIC_CONTRACT_ID", CONTRACT_ID);

    const StellarSdk = await import("@stellar/stellar-sdk");
    const stellar = await import("@/lib/stellar");
    server = stellar.sorobanServer as unknown as typeof server;

    server.getAccount.mockResolvedValue(
      new StellarSdk.Account(PUBKEY, "1"),
    );
    server.simulateTransaction.mockResolvedValue({});
    server.sendTransaction.mockResolvedValue({
      status: "SUCCESS",
      hash: "test_tx_hash",
    });

    liveContract = await import("@/lib/contract");
    expect(liveContract.USE_MOCK).toBe(false);

    callSpy = vi.spyOn(StellarSdk.Contract.prototype, "call");
    // The SDK's XDR serializer hits a dual-package instanceof bug under
    // vitest; argument encoding is already captured by the Contract.call
    // spy, so stub out the serialize/parse boundary of the pipeline.
    toXdrSpy = vi
      .spyOn(StellarSdk.Transaction.prototype, "toXDR")
      .mockReturnValue("dGVzdA==");
    fromXdrSpy = vi
      .spyOn(StellarSdk.TransactionBuilder, "fromXDR")
      .mockReturnValue({} as unknown as Transaction);
  });

  afterAll(() => {
    callSpy?.mockRestore();
    toXdrSpy?.mockRestore();
    fromXdrSpy?.mockRestore();
    vi.unstubAllEnvs();
  });

  it("createPoll invokes create_poll with encoded arguments", async () => {
    const res = await liveContract.createPoll(
      PUBKEY,
      "m1",
      "Will test succeed?",
      ["yes", "no"],
      10,
    );

    expect(res.status).toBe("SUCCESS");
    expect(res.hash).toBe("test_tx_hash");

    const { method, args } = lastContractCall();
    expect(method).toBe("create_poll");
    expect(args[0]).toBe(PUBKEY);
    expect(args[1]).toBe("m1");
    expect(args[2]).toBe("Will test succeed?");
    expect(args[3]).toEqual(["yes", "no"]);
    expect(args[4]).toBe(100_000_000n); // 10 XLM in stroops
  });

  it("placeBet invokes place_bet with encoded arguments", async () => {
    const res = await liveContract.placeBet(PUBKEY, "m1-p1", 0, 25);

    expect(res.status).toBe("SUCCESS");

    const { method, args } = lastContractCall();
    expect(method).toBe("place_bet");
    expect(args[0]).toBe(PUBKEY);
    expect(args[1]).toBe("m1-p1");
    expect(args[2]).toBe(0);
    expect(args[3]).toBe(250_000_000n); // 25 XLM in stroops
  });

  it("castVote invokes cast_vote with encoded arguments", async () => {
    const res = await liveContract.castVote(PUBKEY, "m1-p1", 0);

    expect(res.status).toBe("SUCCESS");

    const { method, args } = lastContractCall();
    expect(method).toBe("cast_vote");
    expect(args[0]).toBe(PUBKEY);
    expect(args[1]).toBe("m1-p1");
    expect(args[2]).toBe(0);
  });

  it("claimWinnings invokes claim_winnings with encoded arguments", async () => {
    const res = await liveContract.claimWinnings(PUBKEY, "m1-p1");

    expect(res.status).toBe("SUCCESS");

    const { method, args } = lastContractCall();
    expect(method).toBe("claim_winnings");
    expect(args[0]).toBe(PUBKEY);
    expect(args[1]).toBe("m1-p1");
  });

  it("maps a failed simulation to a StellarError", async () => {
    server.simulateTransaction.mockResolvedValueOnce({
      error: "host function invocation failed",
    });

    await expect(
      liveContract.placeBet(PUBKEY, "m1-p1", 0, 25),
    ).rejects.toMatchObject({
      name: "StellarError",
      code: "TX_FAILED",
    });
  });
});
