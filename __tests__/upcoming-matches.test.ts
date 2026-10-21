/**
 * __tests__/upcoming-matches.test.ts
 *
 * Unit tests for the getUpcomingMatches selector in useMockData.
 * Verifies that only matches with status === "upcoming" are returned,
 * and that live / completed fixtures are excluded.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useMockData } from "@/hooks/use-mock-data";
import type { Match } from "@/lib/mock-data";

// ── Helpers ───────────────────────────────────────────────────────────────────

function setState(matches: Match[]) {
  useMockData.setState({ matches });
}

// ── Shared base fixture (all non-status fields) ───────────────────────────────

const base: Omit<Match, "id" | "status"> = {
  homeTeam: "Team A",
  awayTeam: "Team B",
  venue: "Test Stadium",
  kickoff: new Date(Date.now() + 86_400_000).toISOString(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("getUpcomingMatches selector", () => {
  beforeEach(() => {
    setState([
      { ...base, id: "m1", status: "upcoming" },
      { ...base, id: "m2", status: "upcoming" },
      { ...base, id: "m3", status: "live" },
      { ...base, id: "m4", status: "completed" },
    ]);
  });

  it("returns only upcoming-status matches", () => {
    const result = useMockData.getState().getUpcomingMatches();
    expect(result).toHaveLength(2);
    expect(result.every((m) => m.status === "upcoming")).toBe(true);
  });

  it("excludes live matches", () => {
    const result = useMockData.getState().getUpcomingMatches();
    expect(result.find((m) => m.status === "live")).toBeUndefined();
  });

  it("excludes completed matches", () => {
    const result = useMockData.getState().getUpcomingMatches();
    expect(result.find((m) => m.status === "completed")).toBeUndefined();
  });

  it("returns an empty array when there are no upcoming matches", () => {
    setState([
      { ...base, id: "m5", status: "live" },
      { ...base, id: "m6", status: "completed" },
    ]);
    const result = useMockData.getState().getUpcomingMatches();
    expect(result).toHaveLength(0);
  });

  it("returns all matches when every match is upcoming", () => {
    setState([
      { ...base, id: "m7", status: "upcoming" },
      { ...base, id: "m8", status: "upcoming" },
      { ...base, id: "m9", status: "upcoming" },
    ]);
    const result = useMockData.getState().getUpcomingMatches();
    expect(result).toHaveLength(3);
  });
});

describe("Upcoming matches pool totals and poll counts", () => {
  it("updates match pool total when a stake is placed via updatePollPool", () => {
    const matchId = "test-match-1";
    const pollId = "test-poll-1";

    useMockData.setState({
      matches: [
        {
          id: matchId,
          homeTeam: "Team X",
          awayTeam: "Team Y",
          kickoff: new Date().toISOString(),
          status: "upcoming",
          venue: "Main Stadium",
        },
      ],
      polls: [
        {
          id: pollId,
          matchId,
          question: "Will Team X score first?",
          status: "active",
          yesPool: 100,
          noPool: 50,
          participants: 2,
          stakeCount: 2,
          stakers: ["G1", "G2"],
          category: "team_event",
          lockTime: "kickoff",
        },
      ],
    });

    const initialPolls = useMockData.getState().polls;
    const initialMatchPolls = initialPolls.filter((p) => p.matchId === matchId);
    const initialTotalPool = initialMatchPolls.reduce(
      (acc, p) => acc + p.yesPool + p.noPool,
      0,
    );
    expect(initialTotalPool).toBe(150);

    useMockData.getState().updatePollPool(pollId, "yes", 50, "G3");

    const updatedPolls = useMockData.getState().polls;
    expect(updatedPolls).not.toBe(initialPolls);

    const updatedMatchPolls = updatedPolls.filter((p) => p.matchId === matchId);
    const updatedTotalPool = updatedMatchPolls.reduce(
      (acc, p) => acc + p.yesPool + p.noPool,
      0,
    );
    expect(updatedTotalPool).toBe(200);
    expect(updatedMatchPolls).toHaveLength(1);
  });
});

