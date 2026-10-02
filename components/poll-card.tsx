"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Clock, Users, Info, Lock, Zap } from "lucide-react"
import { GamingButton, TeamBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { StakeModal } from "@/components/staking"
import { useWallet } from "@/hooks/use-wallet"
import { useUIStore } from "@/lib/ui-store"
import { useCountdown } from "@/hooks/use-countdown"
import type { Poll, Match, PollCategory, LockTime } from "@/lib/mock-data"
import { lockTimeLabel } from "@/lib/mock-data"
import { getLockTargetISO, isPollLocked } from "@/lib/calculations"
import { getTeamColor } from "@/lib/team-colors"

export interface PollCardProps {
  poll: Poll & { timeLeft?: string; recentActivity?: string; isHottest?: boolean }
  match?: Match
  matchId?: string
  matchName?: string
  variant?: "compact" | "detailed"
  isHottest?: boolean
  animationDelay?: number
}

const CATEGORY_STYLES: Record<string, { label: string; className: string }> = {
  player_event: {
    label: "Player",
    className: "bg-primary/20 text-primary border border-primary/40",
  },
  team_event: {
    label: "Team",
    className: "bg-success/20 text-success border border-success/40",
  },
  score_prediction: {
    label: "Score",
    className: "bg-gold/20 text-gold border border-gold/40",
  },
  other: {
    label: "Other",
    className: "bg-foreground/10 text-foreground border border-border",
  },
}


function CompactCountdown({
  kickoff,
  lockTime,
  lockTargetISO,
}: {
  kickoff: string
  lockTime: LockTime | string
  lockTargetISO?: string
}) {
  const targetISO = getLockTargetISO(kickoff, lockTime, lockTargetISO)
  const { days, hours, minutes, seconds, isExpired, status } = useCountdown(targetISO)

  const colorClass = {
    safe: "text-primary bg-primary/10 border-primary/30",
    warning: "text-gold bg-gold/10 border-gold/30",
    urgent: "text-accent bg-accent/10 border-accent/30 animate-pulse",
    critical: "text-accent bg-accent/20 border-accent/50 animate-pulse",
    expired: "text-muted-foreground bg-surface border-border",
  }[status]

  if (isExpired) {
    return (
      <span className={`px-2 py-1 rounded border text-xs font-mono font-bold ${colorClass}`}>
        LOCKED
      </span>
    )
  }

  const display =
    days > 0
      ? `${days}d ${hours}h`
      : hours > 0
        ? `${hours}h ${minutes}m`
        : `${minutes}m ${seconds}s`

  return (
    <span className={`px-2 py-1 rounded border text-xs font-mono font-bold whitespace-nowrap ${colorClass}`}>
      {display}
    </span>
  )
}

export function PollCard({
  poll,
  match,
  matchId = "",
  matchName = "",
  variant,
  isHottest = false,
  animationDelay = 0,
}: PollCardProps) {
  const router = useRouter()
  const { isConnected } = useWallet()
  const { openWalletConnect } = useUIStore()
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [pendingStake, setPendingStake] = useState(false)
  const [initialSide, setInitialSide] = useState<"yes" | "no">("yes")

  const effectiveMatchId = matchId || poll.matchId || match?.id || ""
  const effectiveMatchName = matchName || (match ? `${match.homeTeam} vs ${match.awayTeam}` : "")
  const effectiveIsHottest = isHottest || !!poll.isHottest

  const total = poll.yesPool + poll.noPool
  const yesPercentage = total > 0 ? (poll.yesPool / total) * 100 : 50
  const noPercentage = 100 - yesPercentage
  const yesPercent = Math.round(yesPercentage)
  const noPercent = 100 - yesPercent

  const isActive = !poll.status || poll.status === "active"
  const isResolved = poll.status === "resolved"
  const isLocked = poll.status === "locked"
  const isVoting = poll.status === "voting"
  const isHighValue = total > 10_000

  /**
   * Lock state, derived from the clock rather than from `poll.status`.
   *
   * Nothing in the codebase transitions `poll.status` when a lock time passes,
   * so a status check alone let an expired poll keep its live CTA. `isPollLocked`
   * compares the current time against the poll's lock point and honours `status`
   * as well, so a resolved or voting poll is closed regardless of the clock.
   */
  const timeLocked = isPollLocked(poll, match)
  const acceptsStakes = isActive && !isLocked && !timeLocked

  const category = CATEGORY_STYLES[poll.category] ?? {
    label: poll.category ? String(poll.category).replace("_", " ") : "Poll",
    className: "bg-primary/20 text-primary border border-primary/40",
  }

  // Handle wallet connect callback for pending stakes
  useEffect(() => {
    if (isConnected && pendingStake) {
      setPendingStake(false)
      setShowStakeModal(true)
    }
  }, [isConnected, pendingStake])

  const openStake = (side: "yes" | "no") => {
    if (!acceptsStakes) return
    setInitialSide(side)
    setShowStakeModal(true)
  }

  const handleCompactStakeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Belt-and-braces with the button's own `disabled`: a programmatic click or a
    // keyboard activation racing the countdown must not slip through.
    if (!acceptsStakes) return
    if (isConnected) {
      setShowStakeModal(true)
    } else {
      setPendingStake(true)
      openWalletConnect()
    }
  }

  const handleCardClick = () => {
    if (effectiveMatchId) {
      router.push(`/match/${effectiveMatchId}`)
    }
  }

  const isCompact = variant === "compact" || (variant === undefined && !!match)

  if (isCompact) {
    return (
      <>
        <div
          onClick={handleCardClick}
          className={[
            "relative bg-surface border-2 clip-corner-lg cursor-pointer",
            "transition-all duration-300 group overflow-hidden",
            effectiveIsHottest
              ? "border-gold hover:shadow-[0_0_40px_rgba(255,215,0,0.35)]"
              : "border-border hover:border-primary hover:shadow-[0_0_30px_rgba(0,217,255,0.2)]",
            isHighValue
              ? "shadow-[inset_0_0_30px_rgba(0,217,255,0.05),0_0_0_1px_rgba(0,217,255,0.1)]"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ animationDelay: `${animationDelay}ms` }}
        >
          {effectiveIsHottest && (
            <div className="absolute top-0 right-0 z-10">
              <div className="px-3 py-1 bg-gradient-to-r from-gold to-amber-500 text-background text-xs font-bold uppercase tracking-wider clip-corner">
                HOTTEST 🔥
              </div>
            </div>
          )}

          {effectiveIsHottest && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-amber-500/10 animate-pulse-glow opacity-60" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/8 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none" />

          <div className="relative p-5 space-y-4">
            {match && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <TeamBadge
                    team={{
                      id: `home-${match.id}`,
                      name: match.homeTeam,
                      primaryColor: getTeamColor(match.homeTeam),
                    }}
                    size="sm"
                  />
                  <span className="text-xs font-bold text-foreground truncate">
                    {match.homeTeam} vs {match.awayTeam}
                  </span>
                  <TeamBadge
                    team={{
                      id: `away-${match.id}`,
                      name: match.awayTeam,
                      primaryColor: getTeamColor(match.awayTeam),
                    }}
                    size="sm"
                  />
                </div>
                <CompactCountdown kickoff={match.kickoff} lockTime={poll.lockTime} lockTargetISO={poll.lockTargetISO} />
              </div>
            )}

            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${category.className}`}
            >
              {category.label}
            </span>

            <p className="font-display text-lg font-bold text-foreground leading-tight">
              {poll.question}
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-success font-bold">
                  YES {yesPercent}% · ${poll.yesPool.toLocaleString()}
                </span>
                <span className="text-accent font-bold">
                  ${poll.noPool.toLocaleString()} · {noPercent}% NO
                </span>
              </div>
              <div className="relative h-3 bg-background-secondary rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-success to-success/70 glow-green transition-all duration-500"
                  style={{ width: `${yesPercent}%` }}
                />
                <div
                  className="absolute right-0 top-0 h-full bg-gradient-to-l from-accent to-accent/70 glow-magenta transition-all duration-500"
                  style={{ width: `${noPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{poll.participants} stakers</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Total Pool
                </p>
                <p className="font-mono font-bold text-gold text-glow-gold text-sm">
                  ${total.toLocaleString()}
                </p>
              </div>
            </div>

            {poll.recentActivity && (
              <p className="text-xs italic text-muted-foreground/80 leading-tight">
                {poll.recentActivity}
              </p>
            )}

            <Button
              onClick={handleCompactStakeClick}
              disabled={!acceptsStakes}
              aria-disabled={!acceptsStakes}
              className={[
                "w-full h-10 font-bold uppercase tracking-wider text-sm",
                "bg-primary hover:bg-primary/90 text-background",
                "glow-cyan hover:shadow-[0_0_25px_rgba(0,217,255,0.5)]",
                "transition-all hover:scale-[1.02]",
                // The hover treatments above would otherwise still animate on a
                // disabled button, which reads as "clickable but broken".
                !acceptsStakes &&
                  "opacity-50 cursor-not-allowed hover:bg-primary hover:scale-100 hover:shadow-none",
              ].join(" ")}
            >
              {acceptsStakes ? (
                <>
                  {isHighValue && <Zap className="mr-1.5 h-4 w-4" />}
                  Stake Now
                </>
              ) : (
                <>
                  <Lock className="mr-1.5 h-4 w-4" />
                  Locked
                </>
              )}
            </Button>
          </div>
        </div>

        <StakeModal
          poll={poll}
          matchId={effectiveMatchId}
          matchName={effectiveMatchName}
          open={showStakeModal}
          onClose={() => setShowStakeModal(false)}
        />
      </>
    )
  }

  // Detailed variant (used on match page and polls list)
  return (
    <>
      <div
        className={[
          "bg-surface border-2 clip-corner-lg transition-all group relative overflow-hidden",
          isActive
            ? "border-border hover:border-primary hover:translate-y-[-2px] hover:shadow-[0_0_30px_rgba(0,217,255,0.15)]"
            : "border-border/50",
          (isLocked || isResolved) ? "opacity-75" : "",
        ].filter(Boolean).join(" ")}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

        <div className="relative p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Question & Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-block px-2 py-1 bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded mb-2">
                    {category.label}
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground text-balance">{poll.question}</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded text-xs font-mono font-bold text-primary whitespace-nowrap">
                  <Clock className="h-4 w-4" />
                  {poll.timeLeft ?? lockTimeLabel(poll.lockTime)}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{poll.participants} stakers</span>
                </div>
                <div className="flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  <span>Locks: {lockTimeLabel(poll.lockTime)}</span>
                </div>
              </div>

              {/* Pool Distribution */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-success font-bold">YES</span>
                    <span className="text-muted-foreground mx-2">•</span>
                    <span className="text-foreground font-mono">${poll.yesPool.toLocaleString()}</span>
                    <span className="text-muted-foreground text-xs ml-2">({yesPercentage.toFixed(0)}%)</span>
                  </div>
                  <div className="text-sm text-right">
                    <span className="text-muted-foreground text-xs mr-2">({noPercentage.toFixed(0)}%)</span>
                    <span className="text-foreground font-mono">${poll.noPool.toLocaleString()}</span>
                    <span className="text-muted-foreground mx-2">•</span>
                    <span className="text-accent font-bold">NO</span>
                  </div>
                </div>

                {/* Visual progress bar */}
                <div className="relative h-4 bg-background-secondary rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-success to-success/80 glow-green transition-all flex items-center justify-end pr-2"
                    style={{ width: `${yesPercentage}%` }}
                  >
                    {yesPercentage > 15 && (
                      <span className="text-[10px] font-bold text-background">{yesPercentage.toFixed(0)}%</span>
                    )}
                  </div>
                  <div
                    className="absolute right-0 top-0 h-full bg-gradient-to-l from-accent to-accent/80 glow-magenta transition-all flex items-center justify-start pl-2"
                    style={{ width: `${noPercentage}%` }}
                  >
                    {noPercentage > 15 && (
                      <span className="text-[10px] font-bold text-background">{noPercentage.toFixed(0)}%</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              {poll.recentActivity && (
                <p className="text-xs italic text-muted-foreground/80 leading-tight">
                  {poll.recentActivity}
                </p>
              )}
            </div>

            {/* Right: Stake Buttons */}
            <div className="flex lg:flex-col gap-3 min-w-[200px]">
              {acceptsStakes ? (
                <>
                  <GamingButton
                    variant="success"
                    size="lg"
                    onClick={() => openStake("yes")}
                    className="flex-1"
                  >
                    Stake YES →
                  </GamingButton>
                  <GamingButton
                    variant="danger"
                    size="lg"
                    onClick={() => openStake("no")}
                    className="flex-1"
                  >
                    Stake NO →
                  </GamingButton>
                </>
              ) : isLocked || timeLocked ? (
                <div className="flex items-center justify-center gap-2 py-4 text-accent font-bold uppercase tracking-wider text-sm">
                  <Lock className="h-4 w-4" />
                  Staking Closed
                </div>
              ) : isVoting ? (
                <div className="flex items-center justify-center gap-2 py-4 text-gold font-bold uppercase tracking-wider text-sm">
                  Awaiting Resolution
                </div>
              ) : isResolved && poll.outcome ? (
                <div
                  className={`flex items-center justify-center gap-2 py-4 font-bold uppercase tracking-wider text-sm ${
                    poll.outcome === "yes" ? "text-success" : "text-accent"
                  }`}
                >
                  {poll.outcome === "yes" ? "YES WON ✓" : "NO WON ✓"}
                </div>
              ) : (
                <GamingButton
                  variant="primary"
                  size="lg"
                  disabled
                  className="flex-1"
                >
                  Unavailable
                </GamingButton>
              )}
            </div>
          </div>
        </div>
      </div>

      <StakeModal
        poll={poll}
        matchId={effectiveMatchId}
        matchName={effectiveMatchName}
        initialSide={initialSide}
        open={showStakeModal}
        onClose={() => setShowStakeModal(false)}
      />
    </>
  )
}
