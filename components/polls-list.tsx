"use client"

import { useState } from "react"
import { PollCard } from "./poll-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import type { PollCategory } from "@/lib/mock-data"

interface PollsListProps {
  matchId: string
}

// ── Category config ────────────────────────────────────────────────────────
// Mirrors the PollCategory enum from lib/mock-data.ts so every category
// that can be created is also selectable here. Adding a new PollCategory
// variant only requires updating this map — no other file needs touching.
const CATEGORY_CONFIG: Record<PollCategory | "all", { label: string }> = {
  all:              { label: "All Polls" },
  player_event:     { label: "Player Events" },
  team_event:       { label: "Team Events" },
  score_prediction: { label: "Score Predictions" },
  other:            { label: "Other" },
}

// Ordered keys — "all" first, then canonical enum values
const CATEGORY_KEYS = [
  "all",
  "player_event",
  "team_event",
  "score_prediction",
  "other",
] as const

type FilterKey = (typeof CATEGORY_KEYS)[number]

// ── Hardcoded seed data (uses canonical PollCategory enum values) ──────────
// NOTE: This legacy component uses local data. The match-detail page
// (components/match/polls-list.tsx) reads from the zustand store and is the
// primary browsing surface. This component exists for the root match page.
const pollsData = [
  {
    id: "legacy-1",
    matchId: "",
    category: "player_event" as PollCategory,
    question: "Will Palmer score a goal?",
    yesPool: 7000,
    noPool: 3000,
    participants: 67,
    stakeCount: 0,
    stakers: [] as string[],
    status: "active" as const,
    timeLeft: "2h 34m",
    lockTime: "kickoff" as const,
    recentActivity: "",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "legacy-2",
    matchId: "",
    category: "player_event" as PollCategory,
    question: "Will Rashford be subbed out?",
    yesPool: 2100,
    noPool: 3200,
    participants: 38,
    stakeCount: 0,
    stakers: [] as string[],
    status: "active" as const,
    timeLeft: "2h 34m",
    lockTime: "60min" as const,
    recentActivity: "",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "legacy-3",
    matchId: "",
    category: "team_event" as PollCategory,
    question: "Will Chelsea win by 2+ goals?",
    yesPool: 1800,
    noPool: 2400,
    participants: 29,
    stakeCount: 0,
    stakers: [] as string[],
    status: "active" as const,
    timeLeft: "2h 34m",
    lockTime: "kickoff" as const,
    recentActivity: "",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "legacy-4",
    matchId: "",
    category: "score_prediction" as PollCategory,
    question: "Will there be 3+ goals total?",
    yesPool: 4200,
    noPool: 1900,
    participants: 52,
    stakeCount: 0,
    stakers: [] as string[],
    status: "active" as const,
    timeLeft: "2h 34m",
    lockTime: "kickoff" as const,
    recentActivity: "",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "legacy-5",
    matchId: "",
    category: "player_event" as PollCategory,
    question: "Will Bruno Fernandes get a yellow card?",
    yesPool: 1500,
    noPool: 1700,
    participants: 24,
    stakeCount: 0,
    stakers: [] as string[],
    status: "active" as const,
    timeLeft: "2h 34m",
    lockTime: "halftime" as const,
    recentActivity: "",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
]

// ── Component ──────────────────────────────────────────────────────────────
export function PollsList({ matchId }: PollsListProps) {
  const [activeCategory, setActiveCategory] = useState<FilterKey>("all")

  // Assign the matchId prop to each poll so PollCard has the correct route
  const polls = pollsData.map((p) => ({ ...p, matchId }))

  const filteredPolls =
    activeCategory === "all"
      ? polls
      : polls.filter((p) => p.category === activeCategory)

  return (
    <div>
      <Tabs
        value={activeCategory}
        onValueChange={(v) => setActiveCategory(v as FilterKey)}
        className="w-full"
      >
        <TabsList className="bg-surface border border-border mb-6">
          {CATEGORY_KEYS.map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              className="data-[state=active]:bg-primary data-[state=active]:text-background font-bold uppercase text-xs tracking-wider"
            >
              {CATEGORY_CONFIG[key].label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-4">
          {filteredPolls.map((poll) => (
            <PollCard key={poll.id} poll={poll} matchId={matchId} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
