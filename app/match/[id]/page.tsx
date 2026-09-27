"use client";
import { MatchHeader } from "@/components/match-header";
import { PollsList } from "@/components/polls-list";
import { CreatePollButton } from "@/components/create-poll-button";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useMockData } from "@/hooks/use-mock-data";
import { usePollList } from "@/hooks/use-chain-data";
import { GamingButton, GlowCard } from "@/components/shared";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { MatchStatsBar } from "@/components/match";

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const matchId = params.id;
  const allPolls = useMockData((s) => s.polls);
  const getMatch = useMockData((s) => s.getMatch);

  const match = getMatch(matchId);
  const polls = useMemo(
    () => allPolls.filter((p) => p.matchId === matchId),
    [allPolls, matchId],
  );

  // Aggregate stats
  const totalPool = useMemo(
    () => polls.reduce((sum, p) => sum + p.yesPool + p.noPool, 0),
    [polls],
  );
  const totalParticipants = useMemo(
    () => polls.reduce((sum, p) => sum + p.participants, 0),
    [polls],
  );

  /* ── Invalid match ID → 404-style state ────────────────────────────── */
  if (!match) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <GlowCard variant="danger" className="max-w-md w-full text-center">
          <div className="relative z-20 p-8 space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-accent" />
            <h1 className="font-display text-2xl font-black uppercase text-foreground">
              Match Not Found
            </h1>
            <p className="text-sm text-muted-foreground">
              The match you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <Link href="/">
              <GamingButton variant="primary" size="md">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </GamingButton>
            </Link>
          </div>
        </GlowCard>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Back link */}
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
        <MatchHeader matchId={params.id} />
      </div>
      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-8 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-black uppercase text-primary text-glow-cyan mb-2">
                Active Prediction Markets
              </h2>
              {isRefetching && (
                <RefreshCw className="h-4 w-4 text-primary animate-spin mb-2" />
              )}
            </div>
            <p className="text-muted-foreground">
              Choose a poll and stake on the outcome you believe will happen
            </p>
          </div>
          {/* Only show the create-poll CTA for upcoming matches — creating a
              market for a live or completed game makes no sense and the modal's
              own match dropdown (upcoming-only) would leave the pre-filled ID
              unresolvable. */}
          {match.status === "upcoming" && (
            <CreatePollButton matchId={params.id} />
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 rounded bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <PollsList matchId={params.id} />
        )}
      </div>
    </main>
  );
}
