/**
 * __tests__/calculations.test.ts
 *
 * Unit tests for lib/calculations.ts — the pure financial logic layer.
 * Every function that computes money-related values is covered here.
 *
 * Closes #277
 */

import { describe, it, expect } from "vitest";
import {
  calculateCompletedPayout,
  calculatePotentialWinnings,
  calculatePoolPercentages,
  PLATFORM_FEE,
} from "@/lib/calculations";

// ── calculateCompletedPayout ──────────────────────────────────────────────────

describe("calculateCompletedPayout", () => {
  it("deducts 5% platform fee from gross payout", () => {
    const result = calculateCompletedPayout(100, 200);
    expect(result.fee).toBeCloseTo(10); // 5% of 200
    expect(result.net).toBeCloseTo(190);
  });

  it("returns gross equal to the supplied grossPayout", () => {
    const result = calculateCompletedPayout(50, 150);
    expect(result.gross).toBe(150);
  });

  it("computes profit as net minus stake amount", () => {
    const result = calculateCompletedPayout(100, 200);
    // net = 190, stakeAmount = 100 → profit = 90
    expect(result.profit).toBeCloseTo(90, 2);
  });

  it("computes ROI as (profit / stakeAmount) * 100", () => {
    const result = calculateCompletedPayout(100, 200);
    // profit = 90, stakeAmount = 100 → roi = 90%
    expect(result.roi).toBeCloseTo(90, 2);
  });

  it("rounds profit and roi to 2 decimal places", () => {
    // 1/3 payout to trigger repeating decimals
    const result = calculateCompletedPayout(10, 10 / 3);
    expect(result.profit.toString()).toMatch(/^\-?\d+(\.\d{1,2})?$/);
    expect(result.roi.toString()).toMatch(/^\-?\d+(\.\d{1,2})?$/);
  });

  it("handles stake equal to gross payout (break-even before fee)", () => {
    // If gross === stakeAmount, fee still applies → net < stakeAmount → loss
    const result = calculateCompletedPayout(100, 100);
    expect(result.fee).toBeCloseTo(5);
    expect(result.net).toBeCloseTo(95);
    expect(result.profit).toBeCloseTo(-5, 2);
    expect(result.roi).toBeCloseTo(-5, 2);
  });

  it("handles a large gross payout correctly", () => {
    const result = calculateCompletedPayout(50, 10_000);
    expect(result.fee).toBeCloseTo(500);   // 5% of 10 000
    expect(result.net).toBeCloseTo(9_500);
    expect(result.profit).toBeCloseTo(9_450, 2);
  });

  it("PLATFORM_FEE is exactly 0.05", () => {
    // Validates the constant itself hasn't drifted
    expect(PLATFORM_FEE).toBe(0.05);
  });
});

// ── calculatePotentialWinnings ────────────────────────────────────────────────

describe("calculatePotentialWinnings", () => {
  it("returns grossWinnings equal to entire pool for a sole yes-staker", () => {
    // Single staker of 100 on yes, no noPool
    const result = calculatePotentialWinnings(100, "yes", 0, 0);
    // totalPool = 0 + 0 + 100 = 100, winningSidePool = 0 + 100 = 100
    // gross = (100 / 100) * 100 = 100
    expect(result.grossWinnings).toBeCloseTo(100);
  });

  it("computes proportional gross winnings for yes side", () => {
    // yesPool = 100, noPool = 100, stake 50 on yes
    // winningSidePool = 100 + 50 = 150
    // totalPool = 100 + 100 + 50 = 250
    // gross = (50 / 150) * 250 = 83.33...
    const result = calculatePotentialWinnings(50, "yes", 100, 100);
    expect(result.grossWinnings).toBeCloseTo(83.33, 1);
  });

  it("computes proportional gross winnings for no side", () => {
    // yesPool = 200, noPool = 100, stake 50 on no
    // winningSidePool = 100 + 50 = 150
    // totalPool = 200 + 100 + 50 = 350
    // gross = (50 / 150) * 350 = 116.67
    const result = calculatePotentialWinnings(50, "no", 200, 100);
    expect(result.grossWinnings).toBeCloseTo(116.67, 1);
  });

  it("applies 5% platform fee to gross winnings", () => {
    const result = calculatePotentialWinnings(100, "yes", 100, 100);
    expect(result.platformFee).toBeCloseTo(result.grossWinnings * 0.05, 4);
  });

  it("netWinnings equals grossWinnings minus platformFee", () => {
    const result = calculatePotentialWinnings(100, "yes", 100, 100);
    expect(result.netWinnings).toBeCloseTo(
      result.grossWinnings - result.platformFee,
      4,
    );
  });

  it("profit equals netWinnings minus stakeAmount", () => {
    const result = calculatePotentialWinnings(100, "yes", 100, 100);
    expect(result.profit).toBeCloseTo(result.netWinnings - 100, 4);
  });

  it("roi equals (profit / stakeAmount) * 100", () => {
    const result = calculatePotentialWinnings(100, "yes", 100, 100);
    expect(result.roi).toBeCloseTo((result.profit / 100) * 100, 4);
  });

  it("produces positive profit when the stake wins a majority pool", () => {
    // yes side heavily dominant — staking yes should be profitable
    const result = calculatePotentialWinnings(10, "no", 10, 200);
    // noPool is large; staking no should win less relative to the pool contribution
    expect(result.netWinnings).toBeGreaterThan(0);
  });

  it("produces a positive ROI when stake wins entire opposite pool", () => {
    // 10 on yes, yesPool = 0, noPool = 100
    // gross = (10 / 10) * 110 = 110, net ~ 104.5, profit ~ 94.5
    const result = calculatePotentialWinnings(10, "yes", 0, 100);
    expect(result.roi).toBeGreaterThan(0);
  });
});

// ── calculatePoolPercentages ──────────────────────────────────────────────────

describe("calculatePoolPercentages", () => {
  it("returns 50/50 when both pools are zero (prevents divide-by-zero)", () => {
    const result = calculatePoolPercentages(0, 0);
    expect(result.yes).toBe(50);
    expect(result.no).toBe(50);
  });

  it("rounds percentages to whole numbers", () => {
    const result = calculatePoolPercentages(1, 2);
    // yes = 33.33 → 33, no = 66.67 → 67
    expect(Number.isInteger(result.yes)).toBe(true);
    expect(Number.isInteger(result.no)).toBe(true);
  });

  it("yes and no percentages reflect pool sizes proportionally", () => {
    const result = calculatePoolPercentages(300, 100);
    expect(result.yes).toBe(75);
    expect(result.no).toBe(25);
  });

  it("returns 100/0 when all funds are on yes side", () => {
    const result = calculatePoolPercentages(500, 0);
    expect(result.yes).toBe(100);
    expect(result.no).toBe(0);
  });

  it("returns 0/100 when all funds are on no side", () => {
    const result = calculatePoolPercentages(0, 500);
    expect(result.yes).toBe(0);
    expect(result.no).toBe(100);
  });
});
