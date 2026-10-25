import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

import { PoolProgressBar } from "@/components/shared/pool-progress-bar";
import { GamingButton } from "@/components/shared/gaming-button";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchCardSkeleton, PollCardSkeleton } from "@/components/ui/skeleton-card";
import { PollCard } from "@/components/poll-card";
import type { Poll, Match } from "@/lib/mock-data";

describe("Batch #328 - #331 UI enhancements", () => {
  describe("Issue #328: PoolProgressBar and PollCard", () => {
    it("renders dual-sided Yes (cyan) and No (magenta) percentages and amounts", () => {
      const html = renderToStaticMarkup(
        <PoolProgressBar
          yesPercentage={70}
          yesAmount={7000}
          noAmount={3000}
        />
      );

      expect(html).toContain("YES");
      expect(html).toContain("NO");
      expect(html).toContain("70.0%");
      expect(html).toContain("30.0%");
      // Verify cyan and magenta color styling are present
      expect(html).toContain("#00d9ff");
      expect(html).toContain("#ff006e");
      expect(html).toContain("Total Pool:");
    });

    it("respects showTotal={false} and showLabels={false}", () => {
      const html = renderToStaticMarkup(
        <PoolProgressBar
          yesPercentage={50}
          yesAmount={100}
          noAmount={100}
          showTotal={false}
          showLabels={false}
        />
      );

      expect(html).not.toContain("Total Pool:");
      expect(html).not.toContain("50.0%");
    });

    it("PollCard uses PoolProgressBar instead of green for YES", () => {
      const dummyPoll: Poll = {
        id: "poll-1",
        matchId: "match-1",
        question: "Will Arsenal win?",
        category: "team_event",
        yesPool: 500,
        noPool: 500,
        participants: 10,
        stakeCount: 15,
        stakers: [],
        status: "active",
        lockTime: "kickoff",
        recentActivity: "Recent stake",
      };

      const dummyMatch: Match = {
        id: "match-1",
        homeTeam: "Arsenal",
        awayTeam: "Chelsea",
        venue: "Emirates",
        kickoff: new Date().toISOString(),
        status: "upcoming",
      };

      const html = renderToStaticMarkup(
        <PollCard poll={dummyPoll} match={dummyMatch} variant="compact" />
      );

      // Verify the cyan YES styling from PoolProgressBar is present
      expect(html).toContain("#00d9ff");
      expect(html).toContain("#ff006e");
    });
  });

  describe("Issue #330: GamingButton loadingLabel and success prop", () => {
    it("renders custom loadingLabel when loading is true", () => {
      const htmlStaking = renderToStaticMarkup(
        <GamingButton loading loadingLabel="Staking…">
          Confirm
        </GamingButton>
      );
      expect(htmlStaking).toContain("Staking…");
      expect(htmlStaking).not.toContain("Processing...");

      const htmlCreating = renderToStaticMarkup(
        <GamingButton loading loadingLabel="Creating…">
          Create Poll
        </GamingButton>
      );
      expect(htmlCreating).toContain("Creating…");

      const htmlSubmitting = renderToStaticMarkup(
        <GamingButton loading loadingLabel="Submitting…">
          Submit Vote
        </GamingButton>
      );
      expect(htmlSubmitting).toContain("Submitting…");
    });

    it("defaults to Processing... if loadingLabel is omitted", () => {
      const html = renderToStaticMarkup(
        <GamingButton loading>
          Action
        </GamingButton>
      );
      expect(html).toContain("Processing...");
    });

    it("renders success state checkmark when success is true", () => {
      const html = renderToStaticMarkup(
        <GamingButton success>
          Saved!
        </GamingButton>
      );
      expect(html).toContain("Saved!");
      expect(html).toContain("#39ff14"); // Success green text/icon color
    });
  });

  describe("Issue #331: Skeleton components", () => {
    it("Skeleton primitive has pulsing glow classes", () => {
      const html = renderToStaticMarkup(<Skeleton className="h-4 w-20" />);
      expect(html).toContain("animate-pulse");
      expect(html).toContain("bg-[#1a1f3a]/60");
      expect(html).toContain("h-4 w-20");
    });

    it("MatchCardSkeleton renders expected placeholder structure", () => {
      const html = renderToStaticMarkup(<MatchCardSkeleton />);
      expect(html).toContain("animate-pulse");
      expect(html).toContain("bg-[#1a1f3a]/60");
    });

    it("PollCardSkeleton renders expected placeholder structure", () => {
      const html = renderToStaticMarkup(<PollCardSkeleton />);
      expect(html).toContain("animate-pulse");
      expect(html).toContain("bg-[#1a1f3a]/60");
    });
  });
});
