"use client"

import { motion } from "framer-motion"
import { Trophy, MapPin, Calendar, Clock, Shield } from "lucide-react"
import { GlowCard, TeamBadge, CountdownTimer } from "@/components/shared"
import type { Match } from "@/lib/mock-data"
import type { Team } from "@/components/shared/team-badge"
import { getTeamColor } from "@/lib/team-colors"

interface MatchHeaderProps {
  match: Match
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

/** Map a simple string team-name → Team shape needed by TeamBadge */
function toTeam(name: string, color: string): Team {
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    primaryColor: color,
    abbreviation: name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase(),
  }
}

/* ── Status badge ───────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: Match["status"] }) {
  const cfg = {
    upcoming: {
      label: "UPCOMING",
      cls: "bg-primary/20 text-primary border-primary/40",
      dot: "bg-primary",
    },
    live: {
      label: "LIVE",
      cls: "bg-success/20 text-success border-success/40",
      dot: "bg-success animate-pulse",
    },
    completed: {
      label: "COMPLETED",
      cls: "bg-muted/20 text-muted-foreground border-border",
      dot: "bg-muted-foreground",
    },
  }[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${cfg.cls}`}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

/* ── Component ──────────────────────────────────────────────────────────── */

export function MatchHeader({ match }: MatchHeaderProps) {
  const homeTeam = toTeam(match.homeTeam, getTeamColor(match.homeTeam))
  const awayTeam = toTeam(match.awayTeam, getTeamColor(match.awayTeam))

  const kickoff = new Date(match.kickoff)
  const formattedDate = kickoff.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const formattedTime = kickoff.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <GlowCard className="mx-auto max-w-7xl" animated>
        {/* Subtle team-colour gradient background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10 z-0"
          style={{
            background: `linear-gradient(135deg, ${homeTeam.primaryColor}40 0%, transparent 50%, ${awayTeam.primaryColor}40 100%)`,
          }}
        />

        <div className="relative z-20 px-4 py-8 lg:px-8">
          {/* League + Status row */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gold" />
              <span className="text-sm font-bold text-gold uppercase tracking-wider">
                Premier League
              </span>
            </div>
            <StatusBadge status={match.status} />
          </div>

          {/* Fixture title (#314) */}
          <h1 className="sr-only">
            {match.homeTeam} vs {match.awayTeam}
          </h1>

          {/* Teams + VS / Score */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 sm:gap-8 items-center mb-8">
            {/* Home Team */}
            <motion.div
              className="flex flex-col items-center lg:items-end gap-3"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <TeamBadge team={homeTeam} size="lg" />
              <h2 className="font-display text-xl sm:text-3xl lg:text-4xl font-black uppercase text-primary text-glow-cyan text-center lg:text-right leading-tight">
                {match.homeTeam}
              </h2>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Home
              </span>
            </motion.div>

            {/* VS or Score */}
            <div className="flex flex-col items-center justify-center gap-2">
              {match.score ? (
                <motion.div
                  className="flex items-center gap-3"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.25 }}
                >
                  <span className="font-mono text-5xl sm:text-6xl font-black text-foreground">
                    {match.score.home}
                  </span>
                  <span className="font-display text-xl text-muted-foreground">
                    –
                  </span>
                  <span className="font-mono text-5xl sm:text-6xl font-black text-foreground">
                    {match.score.away}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  className="relative"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
                  transition={{ delay: 0.25, duration: 0.6 }}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-surface border-2 border-primary flex items-center justify-center glow-cyan">
                    <span className="font-display text-xl sm:text-2xl font-black text-primary">
                      VS
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Live match-minute indicator */}
              {match.status === "live" && (
                <motion.div
                  className="flex items-center gap-1.5"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="font-mono text-sm font-bold text-success">
                    67&apos;
                  </span>
                </motion.div>
              )}
            </div>

            {/* Away Team */}
            <motion.div
              className="flex flex-col items-center lg:items-start gap-3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <TeamBadge team={awayTeam} size="lg" />
              <h2 className="font-display text-xl sm:text-3xl lg:text-4xl font-black uppercase text-primary text-glow-cyan text-center lg:text-left leading-tight">
                {match.awayTeam}
              </h2>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Away
              </span>
            </motion.div>
          </div>

          {/* Date · Time · Venue */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{formattedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{match.venue}</span>
            </div>
          </div>

          {/* Countdown to kickoff (upcoming only) */}
          {match.status === "upcoming" && (
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <CountdownTimer
                targetTime={match.kickoff}
                label="Kickoff in"
                size="lg"
              />
            </motion.div>
          )}
        </div>
      </GlowCard>
    </motion.div>
  )
}
