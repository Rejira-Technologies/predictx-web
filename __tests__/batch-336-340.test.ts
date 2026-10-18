import { describe, it, expect } from "vitest";
import { MOCK_STAKES } from "@/lib/mock-data";
import { calculateCompletedPayout } from "@/lib/calculations";
import { getTeamAbbreviation, TEAM_ABBREVIATIONS } from "@/lib/team-colors";

describe("Batch #336, #338, #339, #340 regression tests", () => {
  it("#338: completed predictions sum to exactly +$447 net profit", () => {
    const completedStakes = MOCK_STAKES.filter((s) => s.status === "completed");
    expect(completedStakes.length).toBe(6);

    const winCount = completedStakes.filter((s) => s.outcome === "won").length;
    const lossCount = completedStakes.filter((s) => s.outcome === "lost").length;
    expect(winCount).toBe(4);
    expect(lossCount).toBe(2);

    const totalProfit = completedStakes.reduce((sum, s) => sum + (s.profit ?? 0), 0);
    expect(Math.round(totalProfit)).toBe(447);
  });

  it("#340: team abbreviations are canonical across components", () => {
    expect(getTeamAbbreviation("Manchester United")).toBe("MUN");
    expect(getTeamAbbreviation("Manchester City")).toBe("MCI");
    expect(getTeamAbbreviation("Chelsea")).toBe("CHE");
    expect(getTeamAbbreviation("Arsenal")).toBe("ARS");
    expect(getTeamAbbreviation("Liverpool")).toBe("LIV");
    expect(getTeamAbbreviation("Tottenham")).toBe("TOT");
  });

  it("#339: seeded stakes include early predictor qualification", () => {
    const hasEarly = MOCK_STAKES.some((s) => s.stakedWithinFirst5Min === true);
    expect(hasEarly).toBe(true);
  });
});
