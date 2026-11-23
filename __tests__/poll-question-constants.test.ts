/**
 * Boundary-behavior tests for poll question length validation.
 *
 * The unit tests exercise isValidPollQuestionLength — the same predicate the
 * create-poll modal's canGoNext guard uses — so they cannot drift from the
 * component. The render tests drive the actual wizard to step 3 and assert
 * the Next button's disabled state at the 9- and 121-character boundaries.
 *
 * Run with: pnpm vitest run __tests__/poll-question-constants.test.ts
 */

import { describe, test, expect, vi, beforeAll, afterEach } from "vitest";
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  POLL_QUESTION_MIN_LENGTH,
  POLL_QUESTION_MAX_LENGTH,
  isValidPollQuestionLength,
} from "../lib/constants";

// ── Module mocks (hoisted) ────────────────────────────────────────────────────

vi.mock("@/hooks/use-wallet", () => ({
  useWallet: () => ({
    isConnected: true,
    address: "GTESTWALLETADDRESS0000",
    sendTransaction: vi.fn(),
    updateBalance: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-mock-data", () => ({
  useMockData: () => ({ addPoll: vi.fn() }),
}));

// The live preview is not under test — stub it so the modal's import graph
// stays small.
vi.mock("@/components/poll-card", () => ({ PollCard: () => null }));
vi.mock("@/components/wallet-connect-modal", () => ({
  WalletConnectModal: () => null,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Render motion/AnimatePresence as plain passthrough elements so wizard step
// transitions are synchronous and the test does not depend on animation frames.
vi.mock("framer-motion", async () => {
  const React = await import("react");
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: unknown) => {
        if (typeof tag !== "string") return undefined;
        if (tag === "create") return (component: unknown) => component;
        return (props: Record<string, unknown>) =>
          React.createElement(
            tag,
            props,
            props.children as React.ReactNode,
          );
      },
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: () => true,
  };
});

import { CreatePollModal } from "@/components/poll/create-poll-modal";

// ── Predicate boundary tests ──────────────────────────────────────────────────

describe("isValidPollQuestionLength", () => {
  test("POLL_QUESTION_MIN_LENGTH equals 10", () => {
    expect(POLL_QUESTION_MIN_LENGTH).toBe(10);
  });

  test("POLL_QUESTION_MAX_LENGTH equals 120", () => {
    expect(POLL_QUESTION_MAX_LENGTH).toBe(120);
  });

  test("MIN is strictly less than MAX", () => {
    expect(POLL_QUESTION_MIN_LENGTH).toBeLessThan(POLL_QUESTION_MAX_LENGTH);
  });

  // ── Boundary: minimum ──────────────────────────────────────────────────────

  test("question with exactly MIN chars is valid", () => {
    const question = "A".repeat(POLL_QUESTION_MIN_LENGTH); // 10 chars
    expect(isValidPollQuestionLength(question)).toBe(true);
  });

  test("question one char below MIN is invalid", () => {
    const question = "A".repeat(POLL_QUESTION_MIN_LENGTH - 1); // 9 chars
    expect(isValidPollQuestionLength(question)).toBe(false);
  });

  test("empty question is invalid", () => {
    expect(isValidPollQuestionLength("")).toBe(false);
  });

  // ── Boundary: maximum ──────────────────────────────────────────────────────

  test("question with exactly MAX chars is valid", () => {
    const question = "A".repeat(POLL_QUESTION_MAX_LENGTH); // 120 chars
    expect(isValidPollQuestionLength(question)).toBe(true);
  });

  test("question one char over MAX is invalid", () => {
    const question = "A".repeat(POLL_QUESTION_MAX_LENGTH + 1); // 121 chars
    expect(isValidPollQuestionLength(question)).toBe(false);
  });

  // ── Mid-range ──────────────────────────────────────────────────────────────

  test("typical question between MIN and MAX is valid", () => {
    const question = "Will Palmer score a goal in the first half?"; // ~43 chars
    expect(isValidPollQuestionLength(question)).toBe(true);
  });
});

// ── Render-level wizard assertions ────────────────────────────────────────────

function allButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll("button"));
}

function buttonByText(text: string): HTMLButtonElement | undefined {
  return allButtons().find((b) => b.textContent?.includes(text));
}

async function click(el: Element) {
  await act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

async function setQuestion(value: string) {
  const textarea = document.querySelector("textarea");
  expect(textarea).not.toBeNull();
  const setter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )!.set!;
  await act(async () => {
    setter.call(textarea, value);
    textarea!.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("CreatePollModal question step", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  });

  async function renderModal() {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root.render(
        createElement(CreatePollModal, { open: true, onClose: () => {} }),
      );
    });
  }

  async function advanceToQuestionStep() {
    // Step 1 — select the first upcoming match.
    const matchButton = allButtons().find((b) =>
      b.textContent?.includes(" vs "),
    );
    expect(matchButton).toBeDefined();
    await click(matchButton!);
    await click(buttonByText("Next")!);

    // Step 2 — select the first category.
    const categoryButton = allButtons().find((b) =>
      b.textContent?.includes("Player Event"),
    );
    expect(categoryButton).toBeDefined();
    await click(categoryButton!);
    await click(buttonByText("Next")!);

    // Step 3 — the question textarea must be visible.
    expect(document.querySelector("textarea")).not.toBeNull();
  }

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount();
      });
    }
    container?.remove();
  });

  test("Next is disabled for a 9-character question", async () => {
    await renderModal();
    await advanceToQuestionStep();

    await setQuestion("A".repeat(POLL_QUESTION_MIN_LENGTH - 1));
    expect(buttonByText("Next")!.disabled).toBe(true);
  });

  test("Next is disabled for a 121-character question", async () => {
    await renderModal();
    await advanceToQuestionStep();

    await setQuestion("A".repeat(POLL_QUESTION_MAX_LENGTH + 1));
    expect(buttonByText("Next")!.disabled).toBe(true);
  });

  test("Next is enabled for an in-range question", async () => {
    await renderModal();
    await advanceToQuestionStep();

    await setQuestion("A".repeat(POLL_QUESTION_MIN_LENGTH));
    expect(buttonByText("Next")!.disabled).toBe(false);
  });
});
