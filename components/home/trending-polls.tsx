"use client"

import { Flame, RefreshCw } from "lucide-react"
import { PollCard } from "@/components/match/poll-card"
import { usePollList } from "@/hooks/use-chain-data"
import { useMockData } from "@/hooks/use-mock-data"

export function TrendingPolls() {
  const { data: polls, isLoading, isRefetching, error } = usePollList()
  const { getMatch } = useMockData()

  // Sort by total pool descending, take top 6 active polls
  const trending = polls
    ? [...polls]
        .filter((p) => p.status === "active")
        .sort((a, b) => (b.yesPool + b.noPool) - (a.yesPool + a.noPool))
        .slice(0, 6)
    : []

  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-10 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Flame className="h-7 w-7 text-gold text-glow-gold animate-pulse" />
            <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-wider text-foreground">
              Trending Predictions
            </h2>
            <Flame className="h-7 w-7 text-gold text-glow-gold animate-pulse" />
            {isRefetching && (
              <RefreshCw className="h-4 w-4 text-primary animate-spin" />
            )}
          </div>

          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            {error
              ? "Could not refresh — showing cached data"
              : "The most popular predictions right now"}
          </p>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-primary/50" />
            <div className="w-2 h-2 rounded-full bg-primary glow-cyan" />
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-primary/50" />
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-56 rounded bg-surface border border-border animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Poll cards grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trending.map((poll, index) => {
              const match = getMatch(poll.matchId)
              if (!match) return null

              return (
                <PollCard
                  key={poll.id}
                  poll={poll as any}
                  match={match}
                  isHottest={index === 0}
                  animationDelay={index * 100}
                />
              )
            })}
          </div>
        )}

        {!isLoading && trending.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No active predictions right now. Check back soon.
          </p>
        )}
      </div>
    </section>
  )
}
