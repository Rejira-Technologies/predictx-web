import type { Poll } from "@/lib/mock-data";

/**
 * Statuses in which a poll is no longer accepting new stakes.
 * `voting` is the only such value in the current dataset; the remaining
 * entries mirror the contract's resolution-pathway states so this stays
 * correct if/when those are wired in.
 */
const AWAITING_RESOLUTION_STATUSES: readonly string[] = [
  "voting",
  "admin-review",
  "multi-sig-review",
  "dispute",
];

/** A poll is active when it is still accepting stakes. */
export function isPollActive(poll: Pick<Poll, "status">): boolean {
  return poll.status === "active";
}

/** A poll is awaiting resolution once staking has closed and no result is final yet. */
export function isAwaitingResolution(poll: Pick<Poll, "status">): boolean {
  return AWAITING_RESOLUTION_STATUSES.includes(poll.status);
}

export interface PollCounts {
  total: number;
  active: number;
  awaitingResolution: number;
}

/**
 * Split polls into the states the match cards need.
 * Locked and resolved polls are deliberately counted in neither bucket:
 * they accept no new stakes and have no pending outcome.
 */
export function countPollsByStatus(polls: Poll[]): PollCounts {
  const counts: PollCounts = {
    total: polls.length,
    active: 0,
    awaitingResolution: 0,
  };

  for (const poll of polls) {
    if (isPollActive(poll)) counts.active += 1;
    else if (isAwaitingResolution(poll)) counts.awaitingResolution += 1;
  }

  return counts;
}
