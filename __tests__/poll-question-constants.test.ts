/**
 * Boundary-behavior tests for poll question length constants.
 *
 * These tests assert that POLL_QUESTION_MIN_LENGTH and POLL_QUESTION_MAX_LENGTH
 * have the expected values and that validation logic (as used in create-poll-modal.tsx)
 * correctly allows/rejects questions at boundary lengths.
 *
 * Run with: pnpm vitest (after adding vitest to devDependencies)
 * The assertions are framework-agnostic so they can also be adapted for Jest.
 */

import {
  POLL_QUESTION_MIN_LENGTH,
  POLL_QUESTION_MAX_LENGTH,
} from "../lib/constants";

/** Mirrors the validation used in create-poll-modal.tsx canGoNext step 3 */
function isValidQuestionLength(question: string): boolean {
  return (
    question.length >= POLL_QUESTION_MIN_LENGTH &&
    question.length <= POLL_QUESTION_MAX_LENGTH
  );
}

describe("Poll question length constants", () => {
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
    expect(isValidQuestionLength(question)).toBe(true);
  });

  test("question one char below MIN is invalid", () => {
    const question = "A".repeat(POLL_QUESTION_MIN_LENGTH - 1); // 9 chars
    expect(isValidQuestionLength(question)).toBe(false);
  });

  test("empty question is invalid", () => {
    expect(isValidQuestionLength("")).toBe(false);
  });

  // ── Boundary: maximum ──────────────────────────────────────────────────────

  test("question with exactly MAX chars is valid", () => {
    const question = "A".repeat(POLL_QUESTION_MAX_LENGTH); // 120 chars
    expect(isValidQuestionLength(question)).toBe(true);
  });

  test("question one char over MAX is invalid", () => {
    const question = "A".repeat(POLL_QUESTION_MAX_LENGTH + 1); // 121 chars
    expect(isValidQuestionLength(question)).toBe(false);
  });

  // ── Mid-range ──────────────────────────────────────────────────────────────

  test("typical question between MIN and MAX is valid", () => {
    const question = "Will Palmer score a goal in the first half?"; // ~43 chars
    expect(isValidQuestionLength(question)).toBe(true);
  });
});
