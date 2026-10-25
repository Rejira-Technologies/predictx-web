/**
 * __tests__/poll-status.test.ts
 *
 * Unit tests for the poll status helpers in lib/poll-status.
 * These back the fix that stopped locked and voting polls from being
 * counted as "Active Polls" on the home match cards.
 */

import { describe, it, expect } from "vitest";
import {
  isPollActive,
  isAwaitingResolution,
  countPollsByStatus,
} from "@/lib/poll-status";
import type { Poll, PollStatus } from "@/lib/mock-data";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePoll(id: string, status: PollStatus): Poll {
  return {
    id,
    matchId: "m1",
    question: `Question ${id}?`,
    category: "other",
    yesPool: 100,
    noPool: 100,
    participants: 2,
    stakeCount: 2,
    stakers: ["wallet-1", "wallet-2"],
    status,
    lockTime: "kickoff",
    recentActivity: "No activity yet",
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("isPollActive", () => {
  it("treats only active polls as open", () => {
    expect(isPollActive({ status: "active" })).toBe(true);
    expect(isPollActive({ status: "locked" })).toBe(false);
    expect(isPollActive({ status: "voting" })).toBe(false);
    expect(isPollActive({ status: "resolved" })).toBe(false);
  });
});

describe("isAwaitingResolution", () => {
  it("is true for voting polls", () => {
    expect(isAwaitingResolution({ status: "voting" })).toBe(true);
  });

  it("is false for active, locked and resolved polls", () => {
    expect(isAwaitingResolution({ status: "active" })).toBe(false);
    expect(isAwaitingResolution({ status: "locked" })).toBe(false);
    expect(isAwaitingResolution({ status: "resolved" })).toBe(false);
  });
});

describe("countPollsByStatus", () => {
  it("returns zeroed counts for an empty list", () => {
    expect(countPollsByStatus([])).toEqual({
      total: 0,
      active: 0,
      awaitingResolution: 0,
    });
  });

  it("counts only open polls as active", () => {
    const polls = [
      makePoll("p1", "active"),
      makePoll("p2", "active"),
      makePoll("p3", "active"),
      makePoll("p4", "active"),
    ];
    const counts = countPollsByStatus(polls);

    expect(counts.total).toBe(4);
    expect(counts.active).toBe(4);
    expect(counts.awaitingResolution).toBe(0);
  });

  it("does not count locked polls as active", () => {
    // Live match m5: all four polls are locked and accept no new stakes.
    const polls = [
      makePoll("p1", "locked"),
      makePoll("p2", "locked"),
      makePoll("p3", "locked"),
      makePoll("p4", "locked"),
    ];
    const counts = countPollsByStatus(polls);

    expect(counts.total).toBe(4);
    expect(counts.active).toBe(0);
    expect(counts.awaitingResolution).toBe(0);
  });

  it("does not count voting polls as active", () => {
    // Completed match m6: all five polls are in the voting phase.
    const polls = [
      makePoll("p1", "voting"),
      makePoll("p2", "voting"),
      makePoll("p3", "voting"),
      makePoll("p4", "voting"),
      makePoll("p5", "voting"),
    ];
    const counts = countPollsByStatus(polls);

    expect(counts.total).toBe(5);
    expect(counts.active).toBe(0);
    expect(counts.awaitingResolution).toBe(5);
  });

  it("ignores resolved polls in both buckets", () => {
    const polls = [
      makePoll("p1", "active"),
      makePoll("p2", "resolved"),
      makePoll("p3", "resolved"),
      makePoll("p4", "voting"),
    ];
    const counts = countPollsByStatus(polls);

    expect(counts.total).toBe(4);
    expect(counts.active).toBe(1);
    expect(counts.awaitingResolution).toBe(1);
  });

  it("keeps the two buckets disjoint", () => {
    const polls = [
      makePoll("p1", "active"),
      makePoll("p2", "locked"),
      makePoll("p3", "voting"),
      makePoll("p4", "resolved"),
    ];
    const counts = countPollsByStatus(polls);

    expect(counts.active).toBe(1);
    expect(counts.awaitingResolution).toBe(1);
    expect(counts.active + counts.awaitingResolution).toBeLessThanOrEqual(
      counts.total,
    );
  });
});
