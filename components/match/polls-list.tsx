"use client"

import { useState, useMemo, useRef, useEffect } from "react"
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
} from "lucide-react"
import { PollCard } from "@/components/poll-card"
import { GamingTabs, GlowCard, GamingButton } from "@/components/shared"
import { CardErrorBoundary } from "@/components/shared/card-error-boundary"
import type { Poll, Match, PollCategory } from "@/lib/mock-data"
import { getLockTimestamp, getLockTargetISO } from "@/lib/calculations"

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
  }[status]

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

  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (sortOpen) {
      const activeIdx = SORT_OPTIONS.findIndex((s) => s.key === sortBy)
      const targetIdx = activeIdx >= 0 ? activeIdx : 0
      itemRefs.current[targetIdx]?.focus()
    }
  }, [sortOpen, sortBy])

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setSortOpen(true)
    } else if (e.key === "Escape" && sortOpen) {
      e.preventDefault()
      setSortOpen(false)
    }
  }

  const handleItemKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (e.key === "Escape") {
      e.preventDefault()
      setSortOpen(false)
      triggerRef.current?.focus()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      const nextIdx = (index + 1) % SORT_OPTIONS.length
      itemRefs.current[nextIdx]?.focus()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const prevIdx = (index - 1 + SORT_OPTIONS.length) % SORT_OPTIONS.length
      itemRefs.current[prevIdx]?.focus()
    } else if (e.key === "Home") {
      e.preventDefault()
      itemRefs.current[0]?.focus()
    } else if (e.key === "End") {
      e.preventDefault()
      itemRefs.current[SORT_OPTIONS.length - 1]?.focus()
    } else if (e.key === "Tab") {
      setSortOpen(false)
    }
  }

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
            new Date(getLockTargetISO(match.kickoff, a.lockTime, a.lockTargetISO)).getTime() -
            new Date(getLockTargetISO(match.kickoff, b.lockTime, b.lockTargetISO)).getTime(),
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
            ref={triggerRef}
            id="sort-dropdown-trigger"
            type="button"
            aria-haspopup="menu"
            aria-expanded={sortOpen}
            aria-controls="sort-dropdown-menu"
            onClick={() => setSortOpen(!sortOpen)}
            onKeyDown={handleTriggerKeyDown}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded clip-corner text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
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
                  <div
                    id="sort-dropdown-menu"
                    role="menu"
                    aria-labelledby="sort-dropdown-trigger"
                    className="relative z-20"
                  >
                    {SORT_OPTIONS.map((opt, idx) => (
                      <button
                        key={opt.key}
                        ref={(el) => {
                          itemRefs.current[idx] = el
                        }}
                        type="button"
                        role="menuitem"
                        tabIndex={sortBy === opt.key ? 0 : -1}
                        onClick={() => {
                          setSortBy(opt.key)
                          setSortOpen(false)
                          triggerRef.current?.focus()
                        }}
                        onKeyDown={(e) => handleItemKeyDown(e, idx)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
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
              aria-hidden="true"
              className="fixed inset-0 z-40"
              onClick={() => {
                setSortOpen(false)
                triggerRef.current?.focus()
              }}
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
                  poll.status === "locked" || poll.status === "resolved"
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
