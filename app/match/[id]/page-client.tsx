"use client";

import { MatchHeader } from "@/components/match-header";
// #245: use the store-backed PollsList (components/match/polls-list) so polls
// created via CreatePollModal appear immediately — the static version at
// components/polls-list.tsx renders a hardcoded array and never reads the store.
import { PollsList } from "@/components/match/polls-list";
import { CreatePollButton } from "@/components/create-poll-button";
import { useMemo } from "react";
import { useMockData } from "@/hooks/use-mock-data";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface MatchPageClientProps {
  matchId: string;
}

export default function MatchPageClient({ matchId }: MatchPageClientProps) {
  const allPolls = useMockData((s) => s.polls);
  const getMatch = useMockData((s) => s.getMatch);

  const match = getMatch(matchId);
  const polls = useMemo(
    () => allPolls.filter((p) => p.matchId === matchId),
    [allPolls, matchId],
  );

  if (!match) return null;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-4 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to matches
        </Link>
      </div>
      <div className="pt-4 pb-6 px-4 lg:px-8">
        <MatchHeader matchId={matchId} />
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-8 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-black uppercase text-primary text-glow-cyan mb-2">
              Active Prediction Markets
            </h2>
            <p className="text-muted-foreground">
              Choose a poll and stake on the outcome you believe will happen
            </p>
          </div>
          {match.status === "upcoming" && <CreatePollButton matchId={matchId} />}
        </div>
        <PollsList polls={polls} match={match} />
      </div>
    </main>
  );
}