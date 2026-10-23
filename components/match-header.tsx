"use client"

import { Calendar, MapPin, Trophy, Users } from "lucide-react"

interface MatchHeaderProps {
  matchId: string
}

const matchData: Record<string, any> = {
  "1": {
    homeTeam: "Chelsea",
    awayTeam: "Man United",
    date: "Dec 18, 2025",
    time: "19:45",
    venue: "Stamford Bridge",
    league: "Premier League",
    polls: 5,
    totalPool: 15200,
    participants: 134,
  },
}

export function MatchHeader({ matchId }: MatchHeaderProps) {
  const match = matchData[matchId] || matchData["1"]

  return (
    <div className="bg-background-secondary border-b border-primary/20">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-6 w-6 text-gold" />
          <span className="text-sm font-bold text-gold uppercase tracking-wider">{match.league}</span>
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
              <div className="text-xs text-muted-foreground">Date & Time</div>
              <div className="font-bold">
                {match.date} • {match.time}
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
              <div className="font-bold text-success">{match.participants}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 bg-surface rounded clip-corner border border-border">
            <Trophy className="h-5 w-5 text-gold" />
            <div>
              <div className="text-xs text-muted-foreground">Total Pool</div>
              <div className="font-bold text-gold">${match.totalPool.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
