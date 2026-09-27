"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutGrid,
  User,
  Shield,
  Hash,
  Star,
  ChevronDown,
  TrendingDown,
  Clock,
  Users,
  Plus,
  Lock,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  Ban,
} from "lucide-react"
import { PollCard } from "@/components/poll-card"
import { GamingTabs, GlowCard, GamingButton } from "@/components/shared"
import { CardErrorBoundary } from "@/components/shared/card-error-boundary"
import type { Poll, Match, PollCategory } from "@/lib/mock-data"
import { getLockTimestamp } from "@/lib/calculations"

/* ── Sort types ──────────────────────────────────────────────────────────── */

type SortOption = "highest-pool" | "most-participants" | "closing-soon" | "newest"

const SORT_OPTIONS: { key: SortOption; label: string; icon: typeof Clock }[] = [
  { key: "highest-pool", label: "Highest Pool", icon: TrendingDown },
  { key: "most-participants", label: "Most Participants", icon: Users },
  { key: "closing-soon", label: "Closing Soon", icon: Clock },
  { key: "newest", label: "Newest", icon: Clock },
]

/* ── Category filter config ──────────────────────────────────────────────── */

const CATEGORY_KEYS = [
  "all",
  "player_event",
  "team_event",
  "score_prediction",
  "other",
] as const

type CategoryKey = (typeof CATEGORY_KEYS)[number]

const CATEGORY_META: Record<CategoryKey, { label: string; icon: typeof LayoutGrid }> = {
  all: { label: "All Polls", icon: LayoutGrid },
  player_event: { label: "Player Events", icon: User },
  team_event: { label: "Team Events", icon: Shield },
  score_prediction: { label: "Score Predictions", icon: Hash },
  other: { label: "Other", icon: Star },
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

/* ── Status indicator component ────────────────────────────────────────── */

function PollStatusBadge({ status, outcome }: { status: Poll["status"]; outcome?: Poll["outcome"] }) {
  const config = {
    active: {
      icon: CircleDot,
      label: "Open",
      className: "text-success bg-success/10 border-success/30",
      dotClass: "bg-success",
    },
    locked: {
      icon: Lock,
      label: "LOCKED",
      className: "text-accent bg-accent/10 border-accent/30",
      dotClass: "bg-accent",
    },
    voting: {
      icon: AlertCircle,
      label: "Awaiting Resolution",
      className: "text-gold bg-gold/10 border-gold/30",
      dotClass: "bg-gold animate-pulse",
    },
    resolved: {
      icon: CheckCircle2,
      label: outcome === "yes" ? "YES WON" : "NO WON",
      className:
        outcome === "yes"
          ? "text-success bg-success/10 border-success/30"
          : "text-accent bg-accent/10 border-accent/30",
      dotClass: outcome === "yes" ? "bg-success" : "bg-accent",
    },
    cancelled: {
      icon: Ban,
      label: "Cancelled — Refund",
      className: "text-muted-foreground bg-surface border-border",
      dotClass: "bg-muted-foreground",
    },
  }[status] ?? {
    icon: CircleDot,
    label: status,
    className: "text-muted-foreground bg-surface border-border",
    dotClass: "bg-muted-foreground",
  }

  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${config.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  )
}

/* ── Props ───────────────────────────────────────────────────────────────── */

interface PollsListProps {
  polls: Poll[]
  match: Match
}

/* ── Component ──────────────────────────────────────────────────────────── */

export function PollsList({ polls, match }: PollsListProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortOption>("highest-pool")
  const [sortOpen, setSortOpen] = useState(false)

  const matchName = `${match.homeTeam} vs ${match.awayTeam}`

  // Count polls per category for tab badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: polls.length }
    for (const cat of CATEGORY_KEYS) {
      if (cat !== "all") {
        counts[cat] = polls.filter((p) => p.category === cat).length
      }
    }
    return counts
  }, [polls])

  // Build GamingTabs config
  const tabs = useMemo(
    () =>
      CATEGORY_KEYS.map((key) => ({
        key,
        label: CATEGORY_META[key].label,
        count: categoryCounts[key],
      })),
    [categoryCounts],
  )

  // Filter + sort
  const displayedPolls = useMemo(() => {
    let filtered =
      activeCategory === "all"
        ? [...polls]
        : polls.filter((p) => p.category === activeCategory)

    switch (sortBy) {
      case "highest-pool":
        filtered.sort((a, b) => b.yesPool + b.noPool - (a.yesPool + a.noPool))
        break
      case "most-participants":
        filtered.sort((a, b) => b.participants - a.participants)
        break
      case "closing-soon":
        filtered.sort(
          (a, b) =>
            getLockTimestamp(match.kickoff, a.lockTime) -
            getLockTimestamp(match.kickoff, b.lockTime),
        )
        break
      case "newest":
        filtered.reverse()
        break
    }

    return filtered
  }, [polls, activeCategory, sortBy, match.kickoff])

  const allLocked = polls.length > 0 && polls.every((p) => p.status !== "active")

  return (
    <div className="space-y-6">
      {/* All-polls-locked banner */}
      {allLocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded border border-gold/30 bg-gold/10 text-gold text-sm font-bold"
        >
          <Lock className="h-4 w-4" />
          Match has started — staking is closed for most polls
        </motion.div>
      )}

      {/* Category filters + sort row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <GamingTabs
            tabs={tabs}
            activeTab={activeCategory}
            onChange={setActiveCategory}
          />
        </div>

        {/* Sort dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded clip-corner text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            {SORT_OPTIONS.find((s) => s.key === sortBy)?.label}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-50 w-52"
              >
                <GlowCard className="p-1">
                  <div className="relative z-20">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSortBy(opt.key)
                          setSortOpen(false)
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded transition-colors ${
                          sortBy === opt.key
                            ? "bg-primary/20 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-surface"
                        }`}
                      >
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </GlowCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Click-outside overlay */}
          {sortOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setSortOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Poll cards grid */}
      <AnimatePresence mode="wait">
        {displayedPolls.length > 0 ? (
          <motion.div
            key={`${activeCategory}-${sortBy}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {displayedPolls.map((poll, index) => (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className={
                  poll.status === "locked" || poll.status === "resolved" || poll.status === "cancelled"
                    ? "opacity-80"
                    : ""
                }
              >
                {/* Status badge */}
                <div className="mb-2">
                  <PollStatusBadge status={poll.status} outcome={poll.outcome} />
                </div>

                <CardErrorBoundary componentName={`PollCard(${poll.id})`}>
                  <PollCard
                    poll={poll}
                    matchId={match.id}
                    matchName={matchName}
                  />
                </CardErrorBoundary>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          /* Empty category state */
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
              <LayoutGrid className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground mb-2">
              No predictions in this category yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Be the first to create a prediction in this category and start the
              pool!
            </p>
            <GamingButton
              variant="gold"
              size="sm"
              onClick={() => alert("Create Poll feature coming soon!")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create the first prediction!
            </GamingButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
