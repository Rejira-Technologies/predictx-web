/**
 * Regression tests for GitHub issue #444:
 * "Stake-modal pool legend pairs pre-stake amounts with post-stake percentages"
 *
 * The Pool Distribution legend rows must pair each BASE (pre-stake) pool
 * amount with its BASE percentage. Before the fix, the Yes/No rows showed
 * the base amounts (poll.yesPool / poll.noPool) together with the
 * post-stake percentages (previewPct), which only reconciled with the
 * totals when the user had no stake entered.
 *
 * Expected behaviour (verified below):
 *   Yes Pool   → poll.yesPool + poolPct.yes (pre-stake amount & percent)
 *   No Pool    → poll.noPool  + poolPct.no  (pre-stake amount & percent)
 *   Your Stake → stakeAmount
 *   Total      → poll.yesPool + poll.noPool + stakeAmount
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

// React 19 act() support in jsdom
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no ResizeObserver (needed by recharts' ResponsiveContainer)
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!(globalThis as Record<string, unknown>).ResizeObserver) {
  (globalThis as Record<string, unknown>).ResizeObserver = ResizeObserverStub;
}

// ── Module mocks (registered before the component import) ────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/use-wallet", () => ({
  useWallet: () => ({
    isConnected: true,
    address: "GTESTADDRESS0000000000000000000000000000000000000000",
    balance: 100, // 100 XLM ≈ $12 USD
    network: "testnet",
  }),
}));

vi.mock("@/hooks/use-staking", () => ({
  useStaking: () => ({
    placeStake: vi.fn(async () => ({ hash: "0xtest" })),
    calculateWinnings: vi.fn((amount: number) => ({
      grossWinnings: amount * 2,
      platformFee: amount * 0.02,
      profit: amount * 0.98,
      roi: 98,
    })),
  }),
}));

vi.mock("@/hooks/use-mock-data", () => ({
  useMockData: {
    getState: () => ({ getMatch: () => null }),
  },
}));

vi.mock("@/components/wallet-connect-modal", () => ({
  WalletConnectModal: () => null,
}));

import { StakeModal } from "@/components/staking/stake-modal";
import type { Poll } from "@/lib/mock-data";

// ── Helpers ───────────────────────────────────────────────────────────────────
function makePoll(overrides: Partial<Poll> = {}): Poll {
  return {
    id: "p1",
    matchId: "m1",
    question: "Will the home team score first?",
    category: "score_prediction",
    yesPool: 100,
    noPool: 50,
    participants: 3,
    stakeCount: 4,
    stakers: ["alice", "bob", "carol"],
    status: "active",
    lockTime: "kickoff",
    recentActivity: "test",
    createdAt: new Date(Date.now() + 3_600_000).toISOString(),
    ...overrides,
  };
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderModal(poll: Poll, initialSide: "yes" | "no" = "yes") {
  root = createRoot(container);
  act(() => {
    root.render(
      <StakeModal
        open
        onClose={() => {}}
        poll={poll}
        matchName="Test FC vs Demo FC"
        matchId="m1"
        initialSide={initialSide}
      />,
    );
  });
}

/** Set the value of the controlled stake input and notify React. */
function enterStake(amount: number) {
  const input = container.querySelector<HTMLInputElement>("#stake-amount-input");
  if (!input) throw new Error("stake amount input not found");
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!;
    setter.call(input, String(amount));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

/**
 * Find the legend value span for a label.
 * The legend block is located via the unique "Yes Pool" label (the label
 * "Your Stake" also appears in the stake-input section, and the Total row
 * uses `justify-between` instead of an `.ml-auto` value span).
 */
function legendValueFor(label: string): string {
  const allSpans = Array.from(container.querySelectorAll("span"));
  const yesSpan = allSpans.find((s) => s.textContent?.trim() === "Yes Pool");
  if (!yesSpan) throw new Error("legend block (Yes Pool) not found");
  const legend = yesSpan.parentElement!.parentElement as HTMLElement;
  const labelSpan = Array.from(legend.querySelectorAll("span")).find(
    (s) => s.textContent?.trim() === label,
  );
  if (!labelSpan) throw new Error(`legend label "${label}" not found`);
  const row = labelSpan.parentElement!;
  const valueSpan =
    row.querySelector(".ml-auto") ??
    Array.from(row.querySelectorAll("span")).find(
      (s) => s !== labelSpan && (s.textContent?.trim().length ?? 0) > 0,
    );
  if (!valueSpan) throw new Error(`legend value for "${label}" not found`);
  return valueSpan.textContent ?? "";
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("StakeModal pool legend (issue #444)", () => {
  it("shows base amounts with base percentages when no stake is entered", () => {
    renderModal(makePoll());
    // 100 / 150 = 66.7% → 67 ; 50 / 150 = 33.3% → 33
    expect(legendValueFor("Yes Pool")).toBe("$100.00 (67%)");
    expect(legendValueFor("No Pool")).toBe("$50.00 (33%)");
  });

  it("keeps pairing base amounts with base percentages once a stake is entered", () => {
    renderModal(makePoll());
    enterStake(50); // yes side → post-stake pools 150/50 → 75% / 25%
    // The legend must NOT show the post-stake 75%/25% next to the base amounts.
    expect(legendValueFor("Yes Pool")).toBe("$100.00 (67%)");
    expect(legendValueFor("No Pool")).toBe("$50.00 (33%)");
  });

  it("keeps base percentages even when the stake is placed on the No side", () => {
    renderModal(makePoll(), "no");
    enterStake(50); // no side → post-stake pools 100/100 → 50% / 50%
    // Buggy behaviour would have rendered 50% / 50% here.
    expect(legendValueFor("Yes Pool")).toBe("$100.00 (67%)");
    expect(legendValueFor("No Pool")).toBe("$50.00 (33%)");
  });

  it("shows a stake row and a post-stake total that reconcile with the base rows", () => {
    renderModal(makePoll());
    enterStake(50);
    expect(legendValueFor("Your Stake")).toBe("$50.00");
    expect(legendValueFor("Total")).toBe("$200.00");
  });
});
