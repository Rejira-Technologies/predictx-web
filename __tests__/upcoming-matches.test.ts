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
