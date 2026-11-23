import { describe, it, expect, beforeEach, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { PendingResolution } from "@/components/pending-resolution";
import { useStaking } from "@/hooks/use-staking";
import { useWallet } from "@/hooks/use-wallet";
import { useMockData } from "@/hooks/use-mock-data";
import { MOCK_STAKES, MATCHES, POLLS, type Stake } from "@/lib/mock-data";

// lib/stellar.ts is syntactically broken on upstream main (unrelated merge
// damage) and is imported by the wallet store; stub only what it provides.
vi.mock("@/lib/stellar", () => ({
  getHorizonUrl: () => "https://horizon-testnet.stellar.org",
}));

// React 19 requires this flag for act() outside of React Testing Library.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SEED_WALLET = "GDKXJNLE2YQFPQZ5TK3VZRKPTMJ4OLR3QB7IU6FSCZ6KQF7H4V29F3H";
const OTHER_WALLET = "GOTHERWALLET2YQFPQZ5TK3VZRKPTMJ4OLR3QB7IU6FSCZ6KQF7H4V29F3H";

function makeStake(overrides: Partial<Stake> & Pick<Stake, "id">): Stake {
  return {
    pollId: "m6-p3",
    matchId: "m6",
    matchName: "Everton vs Wolves",
    question: "Will there be a red card?",
    side: "no",
    amount: 300,
    status: "pending_resolution",
    wallet: SEED_WALLET,
    ...overrides,
  };
}

/** Client-render the component so the live Zustand snapshots are read. */
async function renderPending() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(<PendingResolution />);
  });

  const text = container.textContent ?? "";
  await act(async () => {
    root.unmount();
  });
  container.remove();
  return text;
}

describe("PendingResolution (issue #551)", () => {
  beforeEach(() => {
    useWallet.setState({ address: "", isConnected: false });
    useStaking.setState({ stakes: MOCK_STAKES });
    useMockData.setState({ matches: MATCHES, polls: POLLS });
  });

  it("renders the empty state when no wallet is connected", async () => {
    const text = await renderPending();

    expect(text).toContain("No Pending Resolutions");
    expect(text).not.toContain("Brighton vs West Ham");
    expect(text).not.toContain("Will Brighton score first?");
  });

  it("renders the connected wallet's pending stakes from the store, not hardcoded dummy polls", async () => {
    useWallet.setState({ address: SEED_WALLET, isConnected: true });

    const text = await renderPending();

    // The two seeded pending stakes for the demo wallet
    expect(text).toContain("Will there be a red card?");
    expect(text).toContain("Will there be a VAR review?");

    // The previously hardcoded fixture must never appear
    expect(text).not.toContain("Brighton vs West Ham");
    expect(text).not.toContain("Will Brighton score first?");
  });

  it("only shows stakes belonging to the connected wallet", async () => {
    useWallet.setState({ address: OTHER_WALLET, isConnected: true });
    useStaking.setState({
      stakes: [
        makeStake({
          id: "mine",
          pollId: "custom-mine",
          matchId: "custom-match",
          matchName: "Alpha vs Beta",
          question: "Will the connected wallet see this?",
          wallet: OTHER_WALLET,
        }),
        makeStake({ id: "seed", wallet: SEED_WALLET }),
        makeStake({
          id: "active-for-me",
          status: "active",
          question: "Active stakes must not leak in here",
          wallet: OTHER_WALLET,
        }),
      ],
    });

    const text = await renderPending();

    expect(text).toContain("Will the connected wallet see this?");
    expect(text).not.toContain("Will there be a red card?");
    expect(text).not.toContain("Active stakes must not leak in here");
  });

  it("derives the consensus percentage from the community vote tally", async () => {
    useWallet.setState({ address: SEED_WALLET, isConnected: true });

    const text = await renderPending();

    // m6-p3 seeded tally: yes 1, no 6, unclear 1 → 6/7 valid votes = 86%
    expect(text).toContain("86% Consensus");
    // m6-p5 seeded tally: yes 2, no 4, unclear 1 → 4/6 valid votes = 67%
    expect(text).toContain("67% Consensus");
  });

  it("renders the empty state when the wallet has no pending resolutions", async () => {
    useWallet.setState({ address: OTHER_WALLET, isConnected: true });
    useStaking.setState({
      stakes: [makeStake({ id: "someone-else", wallet: SEED_WALLET })],
    });

    const text = await renderPending();

    expect(text).toContain("No Pending Resolutions");
  });
});
