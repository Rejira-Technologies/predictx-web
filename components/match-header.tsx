"use client"

import { Calendar, MapPin, Trophy, Users } from "lucide-react"
import { useMockData } from "@/hooks/use-mock-data"
import { useMemo } from "react"

interface MatchHeaderProps {
  matchId: string
}

export function MatchHeader({ matchId }: MatchHeaderProps) {
  const getMatch = useMockData((state) => state.getMatch)
  const getPolls = useMockData((state) => state.getPolls)

  const match = getMatch(matchId)
  const polls = useMemo(() => getPolls(matchId), [getPolls, matchId])

  if (!match) return null

  const totalPool = polls.reduce((sum, p) => sum + p.yesPool + p.noPool, 0)
  const totalParticipants = polls.reduce((sum, p) => sum + p.participants, 0)

  const kickoff = new Date(match.kickoff)
  const formattedDate = kickoff.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const formattedTime = kickoff.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="bg-background-secondary border-b border-primary/20">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-6 w-6 text-gold" />
          <span className="text-sm font-bold text-gold uppercase tracking-wider">
            {match.league ?? "Football"}
          </span>
        </div>

        {/* Fixture Page Title (accessible and visual #314) */}
        <h1 className="sr-only">
          {match.homeTeam} vs {match.awayTeam}
        </h1>

        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 items-center mb-8">
          {/* Home Team */}
          <div className="text-center lg:text-right">
            <div className="inline-block px-6 py-3 bg-surface clip-corner-lg border border-primary/30 mb-3">
              <h2 className="font-display text-4xl sm:text-5xl font-black uppercase text-primary text-glow-cyan">
                {match.homeTeam}
              </h2>
            </div>
            <div className="text-sm text-muted-foreground">Home</div>
          </div>

          {/* VS Badge */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-surface border-4 border-primary flex items-center justify-center glow-cyan">
                <span className="font-display text-3xl font-black text-primary">VS</span>
              </div>
            </div>
          </div>

          {/* Away Team */}
          <div className="text-center lg:text-left">
            <div className="inline-block px-6 py-3 bg-surface clip-corner-lg border border-primary/30 mb-3">
              <h2 className="font-display text-4xl sm:text-5xl font-black uppercase text-primary text-glow-cyan">
                {match.awayTeam}
              </h2>
            </div>
            <div className="text-sm text-muted-foreground">Away</div>
          </div>
        </div>

        {/* Match Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 px-4 py-3 bg-surface rounded clip-corner border border-border">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Date &amp; Time</div>
              <div className="font-bold">
                {formattedDate} &bull; {formattedTime}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 bg-surface rounded clip-corner border border-border">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Venue</div>
              <div className="font-bold">{match.venue}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 bg-surface rounded clip-corner border border-border">
            <Users className="h-5 w-5 text-success" />
            <div>
              <div className="text-xs text-muted-foreground">Total Participants</div>
              <div className="font-bold text-success">{totalParticipants}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 bg-surface rounded clip-corner border border-border">
            <Trophy className="h-5 w-5 text-gold" />
            <div>
              <div className="text-xs text-muted-foreground">Total Pool</div>
              <div className="font-bold text-gold">${totalPool.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
